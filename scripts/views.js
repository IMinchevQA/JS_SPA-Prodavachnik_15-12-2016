function showView(viewName){
    $('main > section').hide();
    $('#' + viewName).show();
}

function showHideMenuLinks(){
    $('#menu a').hide();
    if(sessionStorage.getItem('authToken')) {
        //Logged in user
        $('#linkHome').show();
        $('#linkListAds').show();
        $('#linkCreateAd').show();
        $('#linkLogout').show();
        $('#loggedInUser')
            .css('display', 'inline');
    } else {
        //No user logged in.
        $('#linkHome').show();
        $('#linkLogin').show();
        $('#linkRegister').show();
        $('#loggedInUser').css('display', 'none');
    }
};

function showHomeView(){
    showView('viewHome');
};

function showLoginView(){
    $('#formLogin').trigger('reset');
    showView('viewLogin')
}

function showRegisterView(){
    //Cleaning up the input fields - reset
    $('#formRegister').trigger('reset');
    showView('viewRegister');
}

function showCreateAdView(){
    $('#formCreateAd').trigger('reset');
    showView('viewCreateAd');
}