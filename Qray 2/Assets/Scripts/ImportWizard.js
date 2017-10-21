import SFB;
import AsImpL;

var objImporter : ObjectImporter;
var renderObjectPrefab : GameObject;  //Predefined object with 'RenderObject' tag, mesh renderers, colliders, etc.
var fileDropdown : UI.Dropdown;
var createDropdown : UI.Dropdown;
var cursor : GameObject;
var lastImport : Transform;


function SelectDropdown() {  //Called when the item selected on the 'file' dropdown is changed. Calls the function corresponding to dropdown selection.
	if(fileDropdown.value == 1) {
		ImportObj();
	}
}

public function ImportObj() {
	var importOptions : ImportOptions = new ImportOptions();
	importOptions.zUp = false;
	var path = StandaloneFileBrowser.OpenFilePanel("Open File", "", "", false)[0].Replace("\\","/");
	Debug.Log("Importing: " + path);
	var obj = new GameObject("import");
	objImporter.ImportModelAsync("import", path, obj.transform, importOptions);
	obj.AddComponent(renderObjectPrefab.GetComponent.<RenderObject>());
	obj.transform.position = cursor.transform.position;
	lastImport = obj.transform;
}

function BoundLast() {
	BoundObjects(lastImport);
}

function BoundObjects(parent : Transform) {
	var b = new Bounds(Vector3.zero, Vector3.zero);
	var p = parent.gameObject.GetComponentsInParent.<MeshFilter>();
	Debug.Log(p.length);
	for(var i = 0; i < p.length; i++) {
		b.Encapsulate(p[i].mesh.bounds);
	}
	var coll = lastImport.gameObject.AddComponent.<BoxCollider>();
	coll.size = b.extents;
	Debug.Log(b.ToString());
}