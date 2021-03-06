﻿import SFB;
var BVH : BVH;
var MaterialWizard : MaterialWizard;

var prevTexture : UI.RawImage;
var prevWindow : RectTransform;

var cam : CameraObject;
var camOrigin : GameObject;
var samples : int = 1;
var tSize : int = 32;
var width : int = 512;
var height : int = 512;
var globalAmbience : Color = Color.black;
var maxBounces : int = 4;
var path : String;
var saveName : String;
var envMap : Texture2D;
var envFac : float = 1;
var emissiveObjects : GameObject[];

var fStop : float = 0.4;
var cursor : Transform;

var samplesField : UI.InputField;
var tileSizeField : UI.InputField;
var widthField : UI.InputField;
var heightField : UI.InputField;
var globalAmbienceField : UI.InputField;
var maxBouncesField : UI.InputField;
var pathText : UI.Text;
var nameField : UI.InputField;
var envFacField : UI.InputField;
var envMapPrev : UI.RawImage;

public function UpdateFields() {
	samples = int.Parse(samplesField.text);
	tSize = int.Parse(tileSizeField.text);
	width = int.Parse(widthField.text);
	height = int.Parse(heightField.text);
	globalAmbience = Color(float.Parse(globalAmbienceField.text), float.Parse(globalAmbienceField.text), float.Parse(globalAmbienceField.text));
	envFac = float.Parse(envFacField.text);
	maxBounces = int.Parse(maxBouncesField.text);
	path = pathText.text;
	PlayerPrefs.SetString("SavePath", path);
	saveName = nameField.text;
}
function ChangeEnvironment() {
	tex = MaterialWizard.LoadTexture();
	envMapPrev.texture = tex;
	envMap = tex;
}

function Start() {
	CheckSavePaths();
	DrawCameraBounds();
}

public static function SyncPreviewShaders() {  //Syncs Unity's realtime raster shaders with the RenderObject textures of each object.
	var renderObjects = GameObject.FindGameObjectsWithTag("RenderObject");
	for(var i = 0; i < renderObjects.length; i++) {
		ro = renderObjects[i].GetComponent("RenderObject");
		renderObjects[i].GetComponent.<Renderer>().material.mainTexture = ro.diffuse;
		//renderObjects[i].GetComponent.<Renderer>().material.
	}
}

public function SyncShaders() {
	var renderObjects = GameObject.FindGameObjectsWithTag("RenderObject");
	for(var i = 0; i < renderObjects.length; i++) {
		var mat = renderObjects[i].GetComponent.<RenderObject>().GetMaterial();
		var renderer = renderObjects[i].GetComponent.<Renderer>();
		renderer.material.mainTexture = mat.maps[0];
		//if(mat.maps[1] != null) { renderer.material.SetTexture("_BumpMap", mat.maps[1]); }
	}
}

function GenerateBVH() {
	BVH.GenerateBVH();
}

function QuadLerp(a : Vector3, b : Vector3, c : Vector3, d : Vector3, u : float, v : float) {  //Converts UV coords of quad plane to 3D coords.
	return Vector3.Lerp(Vector3.Lerp(a, b, u), Vector3.Lerp(d, c, u), v);
}

public function CameraRay(x : int, y : int, w : int, h : int) {  //Returns a camera ray based on the selected camera plane.
		var u : float = (x * 1.0) / w;  //Converts the x,y coords to UV coords from plane. Ensures a precise float is returned.
		var v : float = (y * 1.0) / h;  //<----------------------
		var dir : Vector3 = (QuadLerp(cam.points[2], cam.points[3], cam.points[0], cam.points[1], u, v) - cam.origin.transform.position).normalized;  //Constructs a direction vector via the camera plane origin and the UV plane coord.
		return Ray(cam.origin.transform.position, dir);
}

public function CameraRayDOF(x : int, y : int, w : int, h : int, focus : Vector3, fStop : float) {  //Returns a camera ray based on the selected camera plane.
		var original = TransformSnapshot(cam.origin.transform.position, cam.origin.transform.rotation, cam.origin.transform.localScale);
		DOFShift(cam.origin.transform, focus, fStop);  //This moves the camera a little. More samples will make the image blur due to this shift.
		var u : float = (x * 1.0) / w;  //Converts the x,y coords to UV coords from plane. Ensures a precise float is returned.
		var v : float = (y * 1.0) / h;  //<----------------------
		var dir : Vector3 = (QuadLerp(cam.points[2], cam.points[3], cam.points[0], cam.points[1], u, v) - cam.origin.transform.position).normalized;  //Constructs a direction vector via the camera plane origin and the UV plane coord.
		var origin = cam.origin.transform.position;
		cam.origin.transform.position = original.position;  //Resets the camera position back to the true centre.
		cam.origin.transform.rotation = original.rotation;  //<--------------------
		return Ray(origin, dir);
}

public function DOFShift(cam : Transform, focus : Vector3, fStop : float) {  //Adds some random rotation to the camera for depth of field.
	//focus = cam.forward + Vector3(Mathf.Cos(Vector3.Dot(cam.forward, focus)) - Mathf.Sin(Vector3.Dot(cam.forward, focus)), Mathf.Sin(Vector3.Dot(cam.forward, focus)), Mathf.Cos(Vector3.Dot(cam.forward, focus)));
	focus = Vector3(cam.position.x, cam.position.y, cam.position.z + Vector3.Dot(cam.forward, focus));  //Because we want the focus as a length that is directly in front of the cam origin, not offset.
	var c = Random.insideUnitCircle;
	cam.transform.RotateAround(focus, Vector3(c.x, c.y, 0), fStop);
}


function DrawCameraBounds() {  //Only shows in Unity Editor window. Used to visualise which plane vertices are where.
	Debug.DrawLine(cam.origin.transform.position, cam.points[2], Color.red, 100000, false);
	Debug.DrawLine(cam.origin.transform.position, cam.points[3], Color.blue, 100000, false);
	Debug.DrawLine(cam.origin.transform.position, cam.points[0], Color.green, 100000, false);
	Debug.DrawLine(cam.origin.transform.position, cam.points[1], Color.yellow, 100000, false);
	Debug.DrawLine(cam.origin.transform.position, QuadLerp(cam.points[2], cam.points[3], cam.points[0], cam.points[1], 0.5, 0.5), Color.red, 100000, false);
}

public function SelectCamera(c : GameObject) {  //Selects what camera the ray generation functions will use so it doesn't have to be called a million times.
	if(c.tag == "RenderCamera") {
		cam = c.GetComponent.<CameraObject>();
		Debug.Log("Camera Selected:" + c.name);
	}
	else {
		Debug.Log("Error: Tried to select a camera without 'RenderCamera' tag.");
	}
}

function VectorToEnvUV(vec : Vector3) {  //Converts a Vector3 direction to a uv coord for an environment map.
	var m : float = 2.0f * Mathf.Sqrt(Mathf.Pow(vec.x, 2) + Mathf.Pow(vec.y, 2) + Mathf.Pow(vec.z + 1, 2));
	var uv : Vector2 = Vector2(vec.x, vec.y) / (m + 1);
	uv.y *= -1;
	return uv;
}


function CheckSavePaths() {
	if(PlayerPrefs.HasKey("SavePath")) {
		Debug.Log("Loaded save path: " + PlayerPrefs.GetString("SavePath"));
		pathText.text = PlayerPrefs.GetString("SavePath");

	}
	else {
		PlayerPrefs.SetString("SavePath", Application.persistentDataPath + "/Renders/");
		Debug.Log("Created default save path: " + PlayerPrefs.GetString("SavePath"));
		pathText.text = PlayerPrefs.GetString("SavePath");
	}
}

function SelectDirectory() {
	pathText.text = StandaloneFileBrowser.OpenFolderPanel("Open Folder", "", false)[0].Replace("\\","/");
	PlayerPrefs.SetString("SavePath", pathText.text);
	path = pathText.text;
}

function SetSaveName() {
	saveName = nameField.text;
}

function LoadEmissiveObjects() {
	var objects = GameObject.FindGameObjectsWithTag("RenderObject");
	var eObjects : List.<GameObject> = new List.<GameObject>();
	for(var obj in objects) {
		var ro = obj.GetComponent.<RenderObject>();
		if(ro.emittanceFac > 0) {
			eObjects.Add(obj);
		}
	}
	return eObjects.ToArray();
}

function GetPointOnMesh(obj : GameObject) : RaycastHit{
    var hit : RaycastHit;
    var mesh = obj.GetComponent.<MeshFilter>().mesh;
    var triangleIndex = Random.Range(0,mesh.triangles.Length/3);
    var BC : Vector3;
    BC.x = Random.Range(0.0,1.0);
    BC.y = Random.Range(0.0,1.0-BC.x);
    BC.z = Random.Range(0.0,1.0-BC.x-BC.y);
    hit.barycentricCoordinate = BC;
 	var P1 : Vector3 = mesh.vertices[mesh.triangles[hit.triangleIndex + 0]];
 	var P2 : Vector3 = mesh.vertices[mesh.triangles[hit.triangleIndex + 1]];
 	var P3 : Vector3 = mesh.vertices[mesh.triangles[hit.triangleIndex + 2]];
 	hit.point = obj.transform.TransformPoint(P1*BC.x + P2*BC.y + P3*BC.z);
 	hit.normal = Vector3.Cross((P1-P2),(P3-P2)).normalized;
 	return hit;
}