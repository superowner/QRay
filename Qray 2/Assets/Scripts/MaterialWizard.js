import System.IO;
import SFB;

var activeRenderObject : RenderObject;
var PathTrace : PathTrace;

var lightPanel : GameObject;

//UI Elements----------------
var diffusePrev : UI.RawImage;
//var metallicPrev : UI.RawImage;
var roughnessPrev : UI.RawImage;
var reflectPrev : UI.RawImage;
var emitPrev : UI.RawImage;
var emitFactor : UI.InputField;
//---------------------------

function Start() { lightPanel.SetActive(false); }

public function SelectRenderObject(obj : GameObject) {  //Gets the material properties from the current selection. Called from Transform Wizard when new object selected.
	if(obj.tag == "RenderObject") {
		activeRenderObject = obj.GetComponent.<RenderObject>();
	}
	else {
		Debug.Log("Unrecognised object type selected.");
	}
	UpdateFields();
}

function UpdateFields() {
	diffusePrev.texture = activeRenderObject.diffuse;
	reflectPrev.texture = activeRenderObject.reflectance;
	roughnessPrev.texture = activeRenderObject.roughness;
	if(true) {
		lightPanel.SetActive(true);
		emitFactor.text = activeRenderObject.emittanceFac.ToString();
		emitPrev.texture = activeRenderObject.emittance;
	}
	else { lightPanel.SetActive(false); }
}

function LoadTexture() {
	bytes = File.ReadAllBytes(StandaloneFileBrowser.OpenFilePanel("Open File", "", "", false)[0].Replace("\\","/"));
	tex = Texture2D(2,2);
	tex.LoadImage(bytes);
	return tex;
}

function ChangeDiffuse() {
	tex = LoadTexture();
	diffusePrev.texture = tex;
	activeRenderObject.diffuse = tex;
	PathTrace.LoadRenderObjects();
}
function ChangeReflectance() {
	tex = LoadTexture();
	reflectPrev.texture = tex;
	activeRenderObject.reflectance = tex;
	PathTrace.LoadRenderObjects();
}
function ChangeRoughness() {
	tex = LoadTexture();
	roughnessPrev.texture = tex;
	activeRenderObject.roughness = tex;
	PathTrace.LoadRenderObjects();
}
function ChangeEmittance() {
	tex = LoadTexture();
	emitPrev.texture = tex;
	activeRenderObject.emittance = tex;
	PathTrace.LoadRenderObjects();
}
function ChangeEmitFac() {
	activeRenderObject.emittanceFac = float.Parse(emitFactor.text);
}