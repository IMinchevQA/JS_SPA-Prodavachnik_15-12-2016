const kinveyBaseUrl = "https://baas.kinvey.com/";
const appKey = 'kid_BJ4ffTSzx';
const kinveyAppSecret = 'dad1ce5b5f744a3fb4d1b66da39914b7';
const userData = {
    "username":"guest",
    "password":"guest"
};
const kinveyAppAuthHeaders = {
    'Authorization': "Basic " + btoa(appKey + ':' + kinveyAppSecret),
};

function loginUser(event){
    event.preventDefault();
    let userLoginData = {
        username: $('#formLogin input[name=username]').val(),
        password: $('#formLogin input[name=passwd]').val(),
    };

    if(userLoginData.username != ''
        && userLoginData.password != '') {
        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + appKey + '/login',
            headers: kinveyAppAuthHeaders,
            data: JSON.stringify(userLoginData),
            contentType: 'application/json',
            success: loginSuccess,
            error: handleAjaxError
        });

    } else {
        $('#errorBox').text('There are empty fields. Please fill "Username:" and "Password:"')
        $('#errorBox').show();
        $('#infoBox').show();
        setTimeout(function(){
            $('#errorBox').fadeOut()
        }, 3000);
    }

    function loginSuccess(userInfo){
        saveAuthInSession(userInfo);
        showHideMenuLinks();
        listAds()
        showInfo('Login successful!')
    }
}

function saveAuthInSession(userInfo){
    sessionStorage.setItem("username", userInfo.username);
    sessionStorage.setItem("authToken", userInfo._kmd.authtoken);
    sessionStorage.setItem("userId", userInfo._id);
    $('#loggedInUser').text("Welcome, " + " " + userInfo.username + "!" )

}

function registerUser(event){
    event.preventDefault();
    let userRegisterData = {
        username: $('#formRegister input[name=username]').val(),
        password: $('#formRegister input[name=passwd]').val()
    };

    if(userRegisterData.username != ''
        && userRegisterData.password != '') {
        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + appKey + '/',
            headers: kinveyAppAuthHeaders,
            data: JSON.stringify(userRegisterData),
            contentType: 'application/json',
            success: registerSuccess,
            error: handleAjaxError
        });
    } else {
        $('#errorBox').text('There are empty fields. Please fill "Username:" and "Password:"')
        $('#errorBox').show();
        setTimeout(function(){
            $('#errorBox').fadeOut();
        }, 3000);
    }
    function registerSuccess(userInfo){
        saveAuthInSession(userInfo);
        showHideMenuLinks();
        showInfo('Register successful!');

        setTimeout(function(){
            listAds();
        }, 1000)
    }
}

function logoutUser(){
    $.ajax({
        method:'POST',
        url: kinveyBaseUrl + 'user/' + appKey + '/_logout',
        headers: getKinveyUserAuthHeaders(),
        success: logoutSuccess,
        error: handleAjaxError
    });

    function logoutSuccess() {
        sessionStorage.clear();
        $('#loggedInUser').val('');
        showView('viewHome');
        showHideMenuLinks();
        showInfo('Logout successful!');
    };
}

function getKinveyUserAuthHeaders(){
    return {
        "Authorization": "Kinvey " + sessionStorage.getItem("authToken"),
    }
}