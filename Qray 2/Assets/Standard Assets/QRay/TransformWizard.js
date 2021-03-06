import System;

var MaterialWizard : Component;

var cursor : GameObject;

var posXText : UI.InputField;
var posYText : UI.InputField;
var posZText : UI.InputField;

var rotXText : UI.InputField;
var rotYText : UI.InputField;
var rotZText : UI.InputField;

var scaXText : UI.InputField;
var scaYText : UI.InputField;
var scaZText : UI.InputField;

var nameText : UI.InputField;

public var activeObject : GameObject;

function Update() {
	UpdateTransText();
	if(Input.GetKeyDown(KeyCode.Delete)) {  //Deletes object.
		Destroy(activeObject);
	}
}

public function UpdateTransText() {
	if(activeObject != null) {
		//POSITION
		posXText.text = activeObject.transform.position.x.ToString();
		posYText.text = activeObject.transform.position.y.ToString();
		posZText.text = activeObject.transform.position.z.ToString();
		//ROTATION
		rotXText.text = activeObject.transform.eulerAngles.x.ToString();
		rotYText.text = activeObject.transform.eulerAngles.y.ToString();
		rotZText.text = activeObject.transform.eulerAngles.z.ToString();
		//SCALE
		scaXText.text = activeObject.transform.localScale.x.ToString();
		scaYText.text = activeObject.transform.localScale.y.ToString();
		scaZText.text = activeObject.transform.localScale.z.ToString();

		nameText.text = activeObject.name;
	}
}

public function UpdateObjTrans() {
	if(activeObject != null) {
		activeObject.transform.position = Vector3(Single.Parse(posXText.text), Single.Parse(posYText.text), Single.Parse(posZText.text));
		activeObject.transform.eulerAngles = Vector3(Single.Parse(rotXText.text), Single.Parse(rotYText.text), Single.Parse(rotZText.text));
		activeObject.transform.localScale = Vector3(Single.Parse(scaXText.text), Single.Parse(scaYText.text), Single.Parse(scaZText.text));
	}
}

public function UpdateObjName() {
	activeObject.name = nameText.text;
}

public function SelectObject(obj : GameObject) {
	activeObject = obj;
	MaterialWizard.GetComponent("MaterialWizard").SelectRenderObject(activeObject);
}