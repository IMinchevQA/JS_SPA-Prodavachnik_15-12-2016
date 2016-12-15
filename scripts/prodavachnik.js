function startApp() {
    sessionStorage.clear();
    showView('viewHome');
    showHideMenuLinks();

    //Bind navigation menu links
    $('#linkHome').on('click', showHomeView);
    $('#linkRegister').on('click', showRegisterView);
    $('#linkLogin').on('click', showLoginView);
    $('#linkLogout').on('click', logoutUser);
    $('#linkListAds').on('click', listAds);
    $('#linkCreateAd').on('click', showCreateAdView);

    //Bind the form submit buttons
    $('#formLogin').submit(loginUser);
    $('#formRegister').submit(registerUser);
    $('#formCreateAd').submit(createAd);
    $('#formEditAd').submit(editAd);

    //Bind the info / error boxes: hide on click
    $('#infoBox, #errorBox').on('click', function(){
        $(this).fadeOut();
    });

    //Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $('#loadingBox').show() },
        ajaxStop: function() { $('#loadingBox').hide() }
    });

    

    


    

    

    

    

    

    

    

    

    
}