// $(window).on("load resize", function(e) {
//     setTimeout(function() {
//         positionHeaderElms();
//     }, 10);
// });
//
// function positionHeaderElms() {
//     $(".headerTab").css({
//         top: $("#header").height() - 2 * getRem()
//     });
//
//
//     $(".headerSetting").css({
//         right: $(window).width() * 0.04 - 20
//     });
//
//     $(".headerUpload").css({
//         right: $(".headerSetting").width() + $(window).width() * 0.04 - 10
//     })
// 
//     $(".headerHome").css({
//         right: $(".headerUpload").width() + $(".headerSetting").width() + $(window).width() * 0.04
//     })
// }
//
// /* https://stackoverflow.com/questions/16089004/use-jquery-to-increase-width-of-container-by-10-rem */
// // This Function will always return the initial font-size of the html element
// function getRem() {
//     var html = document.getElementsByTagName('html')[0];
//     return parseInt(window.getComputedStyle(html)['fontSize']);
// }
//
// // This function will convert pixel to rem
// function toRem(length) {
//     return (parseInt(length) / getRem());
// }
