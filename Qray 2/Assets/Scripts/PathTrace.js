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
//-----DYNAMIC OBJECT DATA------
var maps : List.<Texture2D[]>;
var scalars : List.<float[]>;
//

var lights : GameObject[];

function Start() { LoadMaterials(); }

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
	//ImportWizard.InternalColliders(GameObject.FindGameObjectsWithTag("RenderObject"));
	RenderWizard.SyncPreviewShaders();
	//BVH.GenerateBVH();
	Debug.Log("Scene reloaded.");
}

function LoadMaterials() {
	renderObjects = GameObject.FindGameObjectsWithTag("RenderObject");
	maps = new List.<Texture2D[]>();
	scalars = new List.<float[]>();
	for(var i = 0; i < renderObjects.length; i++) {
		ro = renderObjects[i].GetComponent.<RenderObject>();
		ro.id = i;
		mat = ro.GetMaterial();
		maps.Insert(i, mat.maps);
		scalars.Insert(i, mat.scalars);
	}
	//ImportWizard.InternalColliders(GameObject.FindGameObjectsWithTag("RenderObject"));
	RenderWizard.SyncShaders();
	Debug.Log("Materials: " + maps.Count + "  ROs: " + renderObjects.length);
	//BVH.GenerateBVH();
	Debug.Log("Scene reloaded.");
}

function CreateRenderTexture(width : int, height : int) {
	renderTexture = new Texture2D(width, height, TextureFormat.RGB24, false, false);
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
		var r = Radiance(ray, RenderWizard.maxBounces);
		//var r = BDPTRadiance(ray, RenderWizard.maxBounces);
		pixelColor += r.accumulateColor.Clamp(Color.white);
		w += 1; //r.weight;
	}
	pixelColor /= w;
	//var g = 1.0 / 2.2;
	//pixelColor = Color(Mathf.Pow(pixelColor.r, g), Mathf.Pow(pixelColor.g, g), Mathf.Pow(pixelColor.b, g));
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
			//sr = Shaders.BSDF(GetPixelFromUV(diffuse[id], hit.textureCoord), GetPixelFromUV(roughness[id], hit.textureCoord).r, ray.direction, hit, GetPixelFromUV(reflectance[id], hit.textureCoord).r, GetPixelFromUV(transmission[id], hit.textureCoord).r, normal[id].GetPixelBilinear(hit.textureCoord.x, hit.textureCoord.y), ior[id]);  //Calculates a new ray direction based on inputs (shader part).
			//								albedo											roughness															reflectance											transmission						normal																ior
			sr = Shaders.BSDF(GetPixelFromUV(maps[id][0], hit.textureCoord), GetPixelFromUV(maps[id][4], hit.textureCoord).r, ray.direction, hit, GetPixelFromUV(maps[id][2], hit.textureCoord).r, GetPixelFromUV(maps[id][3], hit.textureCoord).r, maps[id][1].GetPixelBilinear(hit.textureCoord.x, hit.textureCoord.y), GetPixelFromUV(maps[id][5], hit.textureCoord).r, scalars[id][1]);  //Calculates a new ray direction based on inputs (shader part).
			ray.direction = sr.direction;  //Calculates a new ray direction based on inputs (shader part).
			ray.origin = sr.origin;  //Sets the new ray origin the shader's chosen location.
			accumulateColor += mask * GetPixelFromUV(maps[id][6], hit.textureCoord) * scalars[id][0]; //Adds accumulate color to mask * emittance * emittanceFac.
			mask *= sr.color;  //Multiplies mask by shader color.
			weight += sr.weight;
		}
		else {
			return LightPath(accumulateColor + mask * GetPixelFromUV(RenderWizard.envMap, Shaders.EnvMapUV(ray.direction)) * RenderWizard.envFac, hit.point, 1);  //Factors in the environment map emittance.
		}
	}
	return LightPath(accumulateColor, hit.point, 1);
}

function BDPTRadiance(ray, bounces) {
	var camRad = Radiance(ray, bounces);
	var lightPoint = RenderWizard.GetPointOnMesh(lights[Random.Range(0, lights.length)]);  //Gets a random point on a random emissive mesh.
	var lightRad = Radiance(Ray(lightPoint.point, Shaders.SampleHemisphereCap(lightPoint.normal, 180)), bounces);
	var color : Color;
	if(!Physics.Linecast(camRad.lastPoint, lightRad.lastPoint)) {
		color = camRad.accumulateColor + lightRad.accumulateColor;
		return LightPath(color, lightPoint.point, 1);  //We say the last point is the light point.
	}
	else {
		return camRad;
	}
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
	lights = RenderWizard.LoadEmissiveObjects();
	CreateRenderTexture(RenderWizard.width, RenderWizard.height);
	//StartCoroutine(RenderAllTiles(RenderWizard.tSize, RenderWizard.tSize));
	StartCoroutine(RenderRandom(RenderWizard.width, RenderWizard.height, RenderWizard.samples));
	//Debug.Log(RenderPixel(0,0,RenderWizard.samples));
	renderTexture.Apply();  //Makes it readable.
}

function StopRender() {
	StopCoroutine("RenderAllTiles");
}