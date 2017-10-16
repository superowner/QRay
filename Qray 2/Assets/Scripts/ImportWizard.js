import SFB;

var ObjImporter : ObjImporter = ObjImporter();
var renderObjectPrefab : GameObject;  //Predefined object with 'RenderObject' tag, mesh renderers, colliders, etc.
var fileDropdown : UI.Dropdown;
var createDropdown : UI.Dropdown;
var cursor : GameObject;


function SelectDropdown() {  //Called when the item selected on the 'file' dropdown is changed. Calls the function corresponding to dropdown selection.
	if(fileDropdown.value == 1) {
		ImportObj();
	}
}


public function ImportObj() {
	var mesh = ObjImporter.ImportFile(StandaloneFileBrowser.OpenFilePanel("Open File", "", "", false)[0].Replace("\\","/"));
	obj = Instantiate(renderObjectPrefab);
	var tmp = obj.GetComponent.<MeshCollider>();
	tmp.sharedMesh = null;
	tmp.sharedMesh = mesh;
	obj.GetComponent.<MeshFilter>().mesh = mesh;
	obj.transform.position = cursor.transform.position;
}


