setsize();

function setsize() {
    var ASPECT = 16 / 8;
    var docwidth = $(window).width() - 50;
    var docheight = $(window).height() - 50;

    if (docwidth > docheight * ASPECT) {
        docwidth = docheight * ASPECT;
    } else {
        docheight = docwidth / ASPECT;
    }

    var con = $('.game');
    con.width(docwidth);
    con.height(docheight);
    con.show();
}

window.onresize = function (event) {
    setsize();
};