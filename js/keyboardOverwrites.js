// Probably remove the ctrl-s one...
// Probably make ctrl-a select the work text...
/*
document.onkeydown = function(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.keyCode === 83) {
            alert("Saving this website has been Disabled");
            e.preventDefault();
            e.stopPropagation();
        } else
        if (e.keyCode === 65) {
            console.log("TODO: make ctrl-a select the works text...");
            e.preventDefault();
            e.stopPropagation();
        }
    }
}
*/

// But only do this when comment box is open etc...
/*
window.onbeforeunload = function() {
    return "Reload page? Changes you made may not be saved.";
}
*/
