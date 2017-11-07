import System.IO;

var libPath : String;
var matPanel : RectTransform;
var matTile : GameObject;

function Start() { CheckKeys(); }

function InstanceTiles(path : String) {
	var files = Directory.GetFiles(path, "*.qmat");
	for(var i = 0; i < files.length; i++) {
		var tile = Instantiate(matTile);
		//tile.GetComponent.<RawImage>().texture = 
	}
}

function CheckKeys() {
	if(!PlayerPrefs.HasKey("MatLibPath")) {
		PlayerPrefs.SetString("MatLibPath", Application.persistentDataPath + "/MaterialLibrary");
	}
	else { libPath = PlayerPrefs.GetString("MatLibPath"); }
}

function GetDirectories(path : String) {
	var dirs = Directory.EnumerateDirectories(path);
}