import System.IO;
import System.Collections.Generic;

var RenderWizard : RenderWizard;
var ImportWizard : ImportWizard;
var BVH : BVH;
var Shaders : Shaders;

var cam : CameraObject;
var camMain : Camera;
var renderCamera : GameObject;
var renderPreview : UI.RawImage;
var renderTexture : Texture2D;
var fudgeFactor : float = 2;
var emitMultiplier : float = 15;


//--------OBJECT DATA-------------
var renderObjects : GameObject[];
var diffuse : Texture2D[];
var normal : Texture2D[];
var roughness : Texture2D[];
var reflectance : Texture2D[];
var transmission : Texture2D[];
var ior : float[];
var emittance : Texture2D[];
var emittanceFac : float[];
//--------------------------------

var lightData : List.<LightData> = new List.<LightData>();  //For experimental bidirectional rendering algorithms.

function Start() { LoadRenderObjects(); Debug.Log(GetPixelFromUV(diffuse[0], Vector2(0.5,0.5))); }

//LOADS ALL THE OBJECT'S DATA INTO ARRAYS ABOVE
function LoadRenderObjects() {
	renderObjects = GameObject.FindGameObjectsWithTag("RenderObject");
	diffuse = new Texture2D[renderObjects.length];
	normal = new Texture2D[renderObjects.length];
	roughness = new Texture2D[renderObjects.length];
	reflectance = new Texture2D[renderObjects.length];
	transmission = new Texture2D[renderObjects.length];
	ior = new float[renderObjects.length];
	emittance = new Texture2D[renderObjects.length];
	emittanceFac = new float[renderObjects.length];
	var ro : RenderObject;
	for(var i = 0; i < renderObjects.length; i++) {
		ro = renderObjects[i].GetComponent("RenderObject");
		ro.id = i;
		diffuse[i] = ro.diffuse;
		normal[i] = ro.normal;
		roughness[i] = ro.roughness;
		reflectance[i] = ro.reflectance;
		transmission[i] = ro.transmission;
		ior[i] = ro.ior;
		emittance[i] = ro.emittance;
		emittanceFac[i] = ro.emittanceFac;
	}
	ImportWizard.InternalColliders(GameObject.FindGameObjectsWithTag("RenderObject"));
	RenderWizard.SyncPreviewShaders();
	Debug.Log("Scene reloaded.");
}

function CreateRenderTexture(width : int, height : int) {
	renderTexture = new Texture2D(width, height, TextureFormat.RGB24, false);
	renderPreview.texture = renderTexture;
}

function SaveRender() {
	var bytes = renderTexture.EncodeToPNG();
	File.WriteAllBytes(RenderWizard.path + "/" + RenderWizard.saveName + ".png", bytes);
}

function RenderPixel(x : int, y : int, s : int) {
	var ray : Ray;
	var pixelColor : Color = Color.black;
	var w : float = 0;
	for(var i = 0; i < s; i++) {
		ray = RenderWizard.CameraRayDOF(x, y, renderTexture.width, renderTexture.height, RenderWizard.cursor.position, RenderWizard.fStop);
		//ray = RenderWizard.CameraRay(x, y, renderTexture.width, renderTexture.height);
		//Debug.DrawRay(ray.origin, ray.direction, Color.red, 10000);
		var r = Radiance(ray, RenderWizard.maxBounces);
		pixelColor += r.accumulateColor;
		w += r.weight;
	}
	pixelColor /= w;
	renderTexture.SetPixel(x, y, pixelColor);
}

function Radiance(ray, bounces) {
	accumulateColor = Color.black;
	mask = Color.white;
	var weight : float = 0;
	var hit : RaycastHit;  //Object ray hits.
	var id : int;  //Index number for mapping textures already in memory.
	var sr : ShaderReturn;
	for(var b = 0; b < bounces; b++) {
		if(Physics.Raycast(ray, hit, 100)) {
			id = hit.transform.GetComponent.<RenderObject>().id;
			sr = Shaders.BSDF(GetPixelFromUV(diffuse[id], hit.textureCoord), GetPixelFromUV(roughness[id], hit.textureCoord).r, ray.direction, hit.normal, GetPixelFromUV(reflectance[id], hit.textureCoord).r, GetPixelFromUV(transmission[id], hit.textureCoord).r, normal[id].GetPixelBilinear(hit.textureCoord.x, hit.textureCoord.y));  //Calculates a new ray direction based on inputs (shader part).
			ray.direction = sr.dir;  //Calculates a new ray direction based on inputs (shader part).
			ray.origin = hit.point;  //Sets the new ray origin to hit location.
			accumulateColor += mask * GetPixelFromUV(emittance[id], hit.textureCoord) * emittanceFac[id]; //Adds accumulate color to mask * emittance * emittanceFac.
			mask *= sr.color;  //Multiplies mask by surface color.
			mask *= Vector3.Dot(ray.direction, hit.normal);
			//mask *= fudgeFactor;
			weight += sr.weight;
		}
		else {
			return LightPath(accumulateColor + mask * GetPixelFromUV(RenderWizard.envMap, Shaders.EnvMapUV(ray.direction)) * RenderWizard.envFac, 1);  //Factors in the environment map emittance.
		}
	}
	return LightPath(accumulateColor, 1);
}


function GetPixelFromUV(texture : Texture2D, uv : Vector2) {  //Returns a color from a UV coord on a texture.
	uv.x *= texture.height;
	uv.y *= texture.width;
	return texture.GetPixel(uv.x, uv.y);
}

function RenderTile(sX : int, sY : int, width : int, height : int, samples : int) {
	for(var x = 0; x < width; x++) {
		for(var y = 0; y < height; y++) {
			RenderPixel(sX + x, sY + y, samples);
		}
	}
}

function RenderAllTiles(tWidth : int, tHeight : int) {
	var iterationsX : int = ~~(renderTexture.width / tWidth);  //Returns the quotient of the two ints divided first.
	var iterationsY : int = ~~(renderTexture.height / tHeight);  //<-----------------
	var remainderX : int = renderTexture.width % tWidth;
	var remainderY : int = renderTexture.height % tHeight;
	for(var x = 0; x < iterationsX; x++) {
		for(var y = 0; y < iterationsY; y++) {
			RenderTile(x * tWidth, y * tHeight, tWidth, tHeight, RenderWizard.samples);
			renderTexture.Apply();
			yield;  //Allows unity to render a frame here.
		}
		if(remainderY > 0) { RenderTile(x * tWidth, (y + 1) * tHeight, tWidth, renderTexture.height - ((y + 1) * tHeight), RenderWizard.samples); yield; }  //Render the remainder tile on the y axis.
	}
	if(remainderX > 0) {
		for(y = 0; y < iterationsY; y++) {  //Render the remainder column  of tiles.
				RenderTile((x + 1) * tWidth, y * tHeight, renderTexture.width - ((x + 1) * tWidth), tHeight, RenderWizard.samples);
				renderTexture.Apply();
				yield;  //Allows unity to render a frame here.
		}
	}
}

function RenderRandom(width : int, height : int, samples : int) {
	var pcMap : Vector2[] = new Vector2[width * height];
	var index : int = 0;
	for(var i = 0; i < width; i++) {
		for(var ii = 0; ii < height; ii++) {
			pcMap[index] = Vector2(i, ii);
			index++;
		}
	}
	var cMap = new List.<Vector2>(pcMap);
	pcMap = null;
	var tSize = RenderWizard.tSize;
	var m = (width * height) / tSize * tSize;
	Debug.Log(cMap.Count);
	for(var iii = 0; iii < m; iii++) {
		for(var y = 0; y < tSize; y++) {
			var r : int = Random.Range(0, cMap.Count);
			RenderPixel(cMap[r].x, cMap[r].y, RenderWizard.samples);
			cMap.RemoveAt(r);
		}
	renderTexture.Apply();
	yield;
	}
}

function DebugRenderTiles() {
	CreateRenderTexture(RenderWizard.width, RenderWizard.height);
	StartCoroutine(RenderAllTiles(RenderWizard.tSize, RenderWizard.tSize));
}

function RenderTilesBiSample() {
	cam.UpdateCamera();
	CreateRenderTexture(RenderWizard.width, RenderWizard.height);
	//StartCoroutine(RenderAllTiles(RenderWizard.tSize, RenderWizard.tSize));
	StartCoroutine(RenderRandom(RenderWizard.width, RenderWizard.height, RenderWizard.samples));
	renderTexture.Apply();  //Makes it readable.
}

function StopRender() {
	StopCoroutine("RenderAllTiles");
}