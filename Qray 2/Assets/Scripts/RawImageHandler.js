import SFB;

var rawImage : UI.RawImage;
var mw : Component;  //Material Wizard.


function Start() { rawImage = this.GetComponent.<UI.RawImage>(); mw =  GameObject.FindWithTag("MaterialEditor").GetComponent("MaterialWizard"); }

function LoadImage() {  //Called when clicked on.
	bytes = File.ReadAllBytes(StandaloneFileBrowser.OpenFilePanel("Open File", "", "", false)[0].Replace("\\","/"));
	tex = Texture2D(2,2);
	tex.LoadImage(bytes);
	rawImage.texture = tex;
	mw.SetMaterial();
}