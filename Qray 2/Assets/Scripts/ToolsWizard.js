var TransformGizmo : Component;
var TransformWizard : TransformWizard;

var quickAddPanel : GameObject;

//Buttons------------------------
var quickAddButton : UI.Button;
var moveButton : UI.Button;
var rotateButton : UI.Button;
var scaleButton : UI.Button;
//-------------------------------

//Primative 3D Objects--------
var pCube : GameObject;
var pSphere : GameObject;
var pPlane : GameObject;
var areaLamp : GameObject;
//----------------------------

function Start() {
	TransformGizmo = Camera.main.GetComponent("TransformGizmo");
	quickAddPanel.SetActive(false);
}



function ToggleQuickAddPanel() {
	quickAddPanel.SetActive(!quickAddPanel.activeSelf);
}

function ToggleMove() {
	TransformGizmo.type = TransformGizmo.TransformType.Move;
}
function ToggleRotate() {
	TransformGizmo.type = TransformGizmo.TransformType.Rotate;
}
function ToggleScale() {
	TransformGizmo.type = TransformGizmo.TransformType.Scale;
}


//Primitive instantiation-----------------
function CreateCube() {
	var obj = Instantiate(pCube);
	obj.transform.position = TransformWizard.cursor.transform.position;
}
function CreateSphere() {
	var obj = Instantiate(pSphere);
	obj.transform.position = TransformWizard.cursor.transform.position;
}
function CreatePlane() {
	var obj = Instantiate(pPlane);
	obj.transform.position = TransformWizard.cursor.transform.position;
}
function CreateAreaLamp() {
	var obj = Instantiate(areaLamp);
	obj.transform.position = TransformWizard.cursor.transform.position;
}
//----------------------------------------