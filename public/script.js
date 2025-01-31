
function removeShadow(id) {
    $('#' + id).removeClass("shadow");

}
function addShadow(id) {
    $('#' + id).addClass("shadow");

}


$(".btn").mouseover(function () {
    let id = $(this).attr("id"); // Get the id of the current element
    removeShadow(id);            // Call the function with the id
});
$(".btn").mouseleave(function () {
    let id = $(this).attr("id"); // Get the id of the current element
    addShadow(id);            // Call the function with the id
});
