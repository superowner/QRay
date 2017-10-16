//Attach to any sprite you want to behave as a billboard (face towards the camera).
function LateUpdate () {
	transform.forward = -Camera.main.transform.forward;
}