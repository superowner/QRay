# QRay
An offline global illumination render engine built with Unity.

QRay is currently in prototype stage, renders are not optimised or efficient yet. These improvments will be made over the next few months.

- Like any renderer, I aim for QRay to be fast and efficient at sampling using multiple cutting edge methods.
- QRay will have physically based surface/volume models implemented that achieve balance in optimisation and accuracy.
- I believe a big factor holding artists back from better images is the lack of understanding in how to get a render platform to produce a desired effect. Thus, QRay will see more automated/preset components for quicker and more realistic renders:
- Dirt is a thing that is everywhere in the real world and it affects the appearance of everything. Dirt and grunge is one feature I want to tackle with automation. I think there is a lack of dirt in CG, which makes renders less realistic by a long way. Dirt can be modelled on an approximative level and a larger scale level, so surface models will need to be able to model different dirt types.
- In most cases, the folks making the render engine know how to model surfaces and volumes realistically. Therefore I think it is appropriate to provide users with more than just basic surface shaders and volume shaders, instead providing a large database of useful and accurate materials. I think that artists with a big library of preset materials in front of them need to have a way of knowing what material from such a huge collection they need to produce their desired image or just to mess around with. Therefore, seeming as the UI is the only way an artist can interact with this library, it is important to organise, represent and categorise materials in the most effective way possible to make sure the user gets the material they need. I think a good material library should be non-repetetive (no similar derivatives of other materials); contain materials users would find hard to model themselves; allow users to change the material properties and attributes without compromising the physical accuracy of the material.

Some renders so far:
![Alt text](https://i.imgur.com/E4ytlD5.png "Cornell Box and Sphere")


![Alt text](https://i.imgur.com/5yBKfMS.png "")


![Alt text](https://i.imgur.com/wuWKmnH.png "")

![Alt text](https://i.imgur.com/A61VNDS.png "")
