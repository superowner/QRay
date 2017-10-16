var panel : RectTransform;
var mousePos : Vector2;
var panelPos : Vector2;

function Start () {
	panel = GetComponent.<RectTransform>();
}

function OnDrag() {
	panel.anchoredPosition = panelPos - ((mousePos - Input.mousePosition) / 2.2);
}

function OnDown() {
	mousePos = Input.mousePosition;
	panelPos = panel.anchoredPosition;
}