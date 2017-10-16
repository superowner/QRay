var sprite : SpriteRenderer;
var tColor : Color = Color.red;
var hit : RaycastHit;

function Update() {
	if(Input.GetMouseButtonDown(2) && !UnityEngine.EventSystems.EventSystem.current.IsPointerOverGameObject()) {
		if(Physics.Raycast(Camera.main.ScreenPointToRay(Input.mousePosition), hit)) {
			transform.position = hit.point;
		}
	}
}

function CheckColors() {
	if(sprite.color == Color.red) {
		tColor = Color.green;
	}
	if(sprite.color == Color.green) {
		tColor = Color.red;
	}
}

function LateUpdate() {
	transform.forward = -Camera.main.transform.forward;
}