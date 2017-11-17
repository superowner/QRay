import System.IO;
import SFB;

var activeRenderObject : RenderObject;
var PathTrace : PathTrace;
var RenderWizard : RenderWizard;

var matLibPath : String;

var lightPanel : GameObject;
var matPanel : RectTransform;
var mapWidget : GameObject;
var scalarWidget : GameObject;
var title : UI.InputField;
var nullTexture : Texture2D;
var matName : UI.InputField;

//UI Elements----------------
var diffusePrev : UI.RawImage;
//var metallicPrev : UI.RawImage;
var roughnessPrev : UI.RawImage;
var reflectPrev : UI.RawImage;
var emitPrev : UI.RawImage;
var emitFactor : UI.InputField;
//---------------------------

function Start() { KeyLoad(); lightPanel.SetActive(false); }

public function SelectRenderObject(obj : GameObject) {  //Gets the material properties from the current selection. Called from Transform Wizard when new object selected.
	if(obj.tag == "RenderObject") {
		activeRenderObject = obj.GetComponent.<RenderObject>();
	}
	else {
		Debug.Log("Unrecognised object type selected.");
	}
	UpdateMaterialPanel();
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

function UpdateMaterialPanel() {
	ClearMaterialPanel();
 	var mat : Mat = activeRenderObject.GetMaterial();
 	matName.text = mat.name;
	for(var i =0; i < mat.maps.length; i++) {
		var tmp = Instantiate(mapWidget);
		tmp.transform.GetChild(2).GetComponent.<UI.Text>().text = mat.mapNames[i];
		tmp.transform.GetChild(0).GetComponent.<UI.Text>().text = "default";
		if(mat.maps[i] == null) { mat.maps[i] = nullTexture; }
		tmp.transform.GetChild(1).GetComponent.<UI.RawImage>().texture = mat.maps[i];
		tmp.transform.SetParent(matPanel.transform);
	}
	for(var ii =0; ii < mat.scalars.length; ii++) {
		tmp = Instantiate(scalarWidget);
		tmp.transform.GetChild(1).GetComponent.<UI.Text>().text = mat.scalarNames[ii];
		tmp.transform.GetChild(0).GetComponent.<UI.Text>().text = "default";
		if(mat.scalars[ii] == null) { mat.scalars[ii] = 0.0; }
		tmp.transform.GetChild(2).GetComponent.<UI.InputField>().text = mat.scalars[ii].ToString();
		tmp.transform.SetParent(matPanel.transform);
	}
}

function SetMaterial() {
	var mat : Mat = activeRenderObject.GetMaterial();
	var index : int;
	for(var element : Transform in matPanel.transform) {
		if(element.tag == "MapWidget") {
			index = System.Array.IndexOf(mat.mapNames, element.GetChild(2).GetComponent.<UI.Text>().text);
			mat.maps[index] = element.GetChild(1).GetComponent.<UI.RawImage>().mainTexture;
		}
		if(element.tag == "ScalarWidget") {
			index = System.Array.IndexOf(mat.scalarNames, element.GetChild(1).GetComponent.<UI.Text>().text);
			mat.scalars[index] = float.Parse(element.GetChild(2).GetComponent.<UI.InputField>().text);
		}
	}
	activeRenderObject.SetMaterial(mat);
	PathTrace.LoadMaterials();
}

function SetActiveName() {
	var mat = activeRenderObject.GetMaterial();
	mat.name = matName.text;
	activeRenderObject.SetMaterial(mat);
}

function SaveActiveMaterial() {
	SaveMaterial(activeRenderObject.GetMaterial(), matLibPath);
}

function SaveMaterial(mat : Mat, path : String) {
	for(var i = 0; i < mat.maps.length; i++) {  //Image maps are stored in MaterialData folder.
		var bytes = mat.maps[i].EncodeToPNG();
		if(!Directory.Exists(matLibPath + "/MaterialData/" + mat.name)) {
			Directory.CreateDirectory(matLibPath + "/MaterialData/" + mat.name);
		}
		File.WriteAllBytes(matLibPath + "/MaterialData/" + mat.name + "/" + mat.mapNames[i] + ".png", bytes);
	}
	JsonManager.WriteJson(mat, path + "/" + mat.name + ".qmat");
	Debug.Log("Material Saved");
}

function LoadMaterial(path : String) {
	var object = JsonManager.ReadJson(path);
	if(object.GetType().ToString() == "Mat") { 
		for(var i = 0; i < object.mapNames.length; i++) {
			var bytes = File.ReadAllBytes(matLibPath + "/MaterialData/" + object.name + "/" + object.mapNames[i] + ".png");
			object.maps[i] = new Texture2D(2,2);
			object.maps[i].LoadImage(bytes);
		}
		return object;
	}
	else { Debug.Log("Error Loading Material: File was not a 'Mat' object."); }
}

function OpenMaterial() {
	var mat : Mat = LoadMaterial(StandaloneFileBrowser.OpenFilePanel("Open File", "", "qmat", false)[0].Replace("\\","/")) as Mat;
	activeRenderObject.SetMaterial(mat);
	UpdateMaterialPanel();
	RenderWizard.SyncShaders();
}

function ClearMaterialPanel() {
	if(matPanel.childCount > 0) {
		for(var i = 0; i < matPanel.childCount; i++) {
			Destroy(matPanel.GetChild(i).gameObject);
		}
	}
}

function KeyLoad() {
	//PlayerPrefs.SetString("MaterialLibPath", System.Environment.GetFolderPath(System.Environment.SpecialFolder.MyDocuments) + "/QRay/Material Library");
	if(!PlayerPrefs.HasKey("MaterialLibPath")) {
		PlayerPrefs.SetString("MaterialLibPath", System.Environment.GetFolderPath(System.Environment.SpecialFolder.MyDocuments) + "/QRay/Material Library");
	}
	matLibPath = PlayerPrefs.GetString("MaterialLibPath");
	if(!Directory.Exists(matLibPath)) {
		Directory.CreateDirectory(matLibPath);
	}
	if(!Directory.Exists(matLibPath + "/MaterialData")) {
		Directory.CreateDirectory(matLibPath + "/MaterialData");
	}
}