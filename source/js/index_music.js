var auio;
function voicePaly () {
    auio = "https://media.onmicrosoft.cn/Tales%20From%20The%20Loop%20S01E03%20Stasis%20%20%5B2160p%20NV%2010bit%20Joy%5D_01.flac";
    auio = new Audio(auio); 
    auio.loop = true;
    auio.play();
    auio.volume = 0.2;
}
function voiceStop () {
    auio.pause();
}
window.onload = function(){
document.getElementById("body-wrap").addEventListener("click", function(){
    voicePaly();
    });
let ap = aplayers[0];
ap.on('play', function () {
    console.log('play');
    voiceStop();
});
ap.on('pause', function () {
    console.log('pause');
    voicePaly();
});
}