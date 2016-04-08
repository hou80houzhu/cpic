/*
 * @packet option; 
 * @require main;
 */
Option({
    name:"root",
    option:{
        override:{
            onendinit:function(){
                this.addChild({
                    type:"@main.picplayer"
                });
            }
        }
    }
});

