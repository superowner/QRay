import System.IO;
import System.Collections.Generic;

var RenderWizard : RenderWizard;
var BVH : BVH;

var cam : Transform;
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
var ior : Texture2D[];
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
	ior = new Texture2D[renderObjects.length];
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
	RenderWizard.SyncPreviewShaders();
	Debug.Log("Scene reloaded.");
}

function CreateRenderTexture(width : int, height : int) {
	renderTexture = new Texture2D(width, height, TextureFormat.RGB24, false);
	renderPreview.texture = renderTexture;
}

function SaveRender() {
	var bytes = renderTexture.EncodeToPNG();
	File.WriteAllBytes(RenderWizard.path + RenderWizard.saveName + ".png", bytes);
}

function RenderPixel(x : int, y : int, s : int) {
	var ray : Ray;
	var pixelColor : Color = Color.black;
	for(var i = 0; i < s; i++) {
		ray = RenderWizard.CameraRayDOF(x, y, renderTexture.width, renderTexture.height, RenderWizard.cursor.position, RenderWizard.fStop);
		pixelColor += Radiance(ray, RenderWizard.maxBounces).accumulateColor;
	}
	pixelColor /= s;
	renderTexture.SetPixel(x, y, pixelColor);
}

function Radiance(ray, bounces) {
	accumulateColor = Color.black;
	mask = Color.white;
	var hit : RaycastHit;  //Object ray hits.
	var id : int;  //Index number for mapping textures already in memory.
	for(var b = 0; b < bounces; b++) {
		if(BVH.Raycast(ray, hit, 100)) {
			id = hit.transform.GetComponent.<RenderObject>().id;
			accumulateColor += mask * GetPixelFromUV(emittance[id], hit.textureCoord) * emittanceFac[id]; //Adds accumulate color to mask * emittance * emittanceFac.
			ray.direction = BSDF(GetPixelFromUV(roughness[id], hit.textureCoord).r, ray.direction, hit.normal, GetPixelFromUV(reflectance[id], hit.textureCoord).r);  //Calculates a new ray direction based on inputs (shader part).
			ray.origin = hit.point;  //Sets the new ray origin to hit location.
			mask *= GetPixelFromUV(diffuse[id], hit.textureCoord);  //Multiplies mask by surface color.
			mask *= Vector3.Dot(ray.direction, hit.normal);
			//mask *= fudgeFactor;
		}
		else {
			return LightPath(accumulateColor + mask * GetPixelFromUV(RenderWizard.envMap, RenderWizard.VectorToEnvUV(ray.direction)) * RenderWizard.envFac, hit.point);  //Factors in the environment map emittance.
		}
	}
	return LightPath(accumulateColor, hit.point);
}

function SamReflectanceModel(normal : Vector3) { //Sam's bad reflectance model. No variance in roughness - fully diffuse.
	var v : Vector3 = Random.onUnitSphere;
	return v * Mathf.Sign(Vector3.Dot(v, normal));
}

function SampleHemisphereCap(normal : Vector3, angle : float) : Vector3 { //Whoop! This one works!
	angle /= 2;
	var targetDirection : Quaternion = Quaternion.LookRotation(normal, Vector3.up);
    var angleInRad = Random.Range(0.0, angle) * Mathf.Deg2Rad;
    var PointOnCircle = (Random.insideUnitCircle.normalized) * Mathf.Sin(angleInRad);
    var V = Vector3(PointOnCircle.x, PointOnCircle.y, Mathf.Cos(angleInRad));
    return targetDirection * V;
}

function BSDF(roughness : float, inRay : Vector3, normal : Vector3, reflectance : float) {  //Bidirectional Scatter Distribution Function - Will eventually take roughness value.
	var rand = Random.Range(0.00, 1.00);
	var reflect : boolean =  reflectance > rand;
	if(reflect) {  //Reflect ray.
		normal = Vector3.Reflect(inRay, normal);
		if(roughness > 0) { return SampleHemisphereCap(normal, roughness * 180.0); } //Applies the roughness to the reflection normal.
		else { return normal; }  //So we don't waste compute power.
	}
	else {  //Transmit ray / diffuse it.
		return SampleHemisphereCap(normal, 180);
	}
}

function SchlickApproximate(ray : Vector3, normal : Vector3, ior : float) {
	var theta = Vector3.Angle(ray, normal);
	var r = Mathf.Pow((1 - ior) / (1 + ior), 2);  //'1' is the first medium ior, for now will stay as 1 (vacuum ior). 'ior' is the new medium ior.
	return r + Mathf.Pow((1 - r) * (1 - Mathf.Cos(theta)), 5);  //Returns the refelction probability (approximation).
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

function DebugRenderTiles() {
	CreateRenderTexture(RenderWizard.width, RenderWizard.height);
	StartCoroutine(RenderAllTiles(RenderWizard.tSize, RenderWizard.tSize));
}

function RenderTilesBiSample() {
	GetLightData(128,128,16);
	CreateRenderTexture(RenderWizard.width, RenderWizard.height);
	StartCoroutine(RenderAllTiles(RenderWizard.tSize, RenderWizard.tSize));
}

function StopRender() {
	StopCoroutine("RenderAllTiles");
}

function SampleLights(ray, bounces) {
	var hit : RaycastHit;  //Object ray hits.
	var id : int;  //Index number for mapping textures already in memory.
	var ld : LightData = LightData(Vector3(0,0,0),Vector3(0,0,0), 0, Color.black);
	for(var b = 0; b < bounces; b++) {
		if(Physics.Raycast(ray, hit, 100)) {
			id = hit.transform.GetComponent.<RenderObject>().id;
			if(emittanceFac[id] > 0) {
				ld.point = hit.point;
				ld.normal = hit.normal;
				ld.id = id;
				ld.color = GetPixelFromUV(emittance[id], hit.textureCoord);
				lightData.Add(ld);
			}
			ray.direction = SamReflectanceModel(hit.normal);
			ray.origin = hit.point;
		}
		else {
			return;
		}
	}
}

function GetLightData(w : int, h : int, b : int) {  //Array size for sample rays and bounce count. (Bigger will produce more light data.)
	lightData.Clear();
	lightData = new List.<LightData>();
	for(var x = 0; x < w; x++) {
		for(var y = 0; y < h; y++) {
			SampleLights(RenderWizard.CameraRay(x, y, w, h), 4);
		}
	}
}