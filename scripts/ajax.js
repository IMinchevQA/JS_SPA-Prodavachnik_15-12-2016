function listAds(){
    $('#ads').find('tr.adsData').remove();
    showView('viewAds')

    $.ajax({
        method: 'GET',
        url: kinveyBaseUrl + "appdata/" + appKey + "/articlesForSale",
        headers: getKinveyUserAuthHeaders(),
        success: loadAddsSuccess,
        error: handleAjaxError
    });

    function loadAddsSuccess(ads){
        showInfo('Ads loaded');
        if(ads.length == 0){
            $('#ads').text('No advertisements available in the base!')
        }
        for(let singleAd of ads){
            let links = [];
            let readMoreLink = $(`<a data-id="${singleAd._id}" href="#">[Read More]</a>`)
                .on('click', function(){
                    displayAdvert($(this).attr("data-id"));
                });
            links.push(readMoreLink);
            if(singleAd._acl.creator == sessionStorage.getItem('userId')) {
                //The following links declaration does not work in Firefox
                // let deleteLink = $('<a href="#">[Delete]</a>').on('click', function(){deleteAdv(singleAd)});
                // let editLink = $('<a href="#">[Edit]</a>').on('click', function(){loadAdForEdit(singleAd)});

                //The following links DO WORK-OK in Firefox
                let deleteLink = $(`<a data-id="${singleAd._id}" href="#">[Delete]</a>`)
                    .on('click', function () {
                        deleteAdv($(this).attr("data-id"))
                    });
                let editLink = $(`<a data-id="${singleAd._id}" href="#">[Edit]</a>]`)
                    .on('click', function () {
                        loadAdForEdit($(this).attr("data-id"))
                    });
                links.push(deleteLink);
                links.push(' ');
                links.push(editLink);
            }

            let row = $('<tr>')
                .addClass('adsData')
                .append($('<td>').text(singleAd.Title))
                .append($('<td>').text(singleAd.Publisher))
                .append($('<td>').text(singleAd.Description))
                .append($('<td>').text(singleAd.Price))
                .append($('<td>').text(singleAd.Date))
                .append($('<td>').append(links))

            $('#ads table').append(row)
        }
    }
};

function createAd(event){
    event.preventDefault();
    let adData = {
        Title: $('#formCreateAd input[name=title]').val(),
        Description: $('#formCreateAd textarea[name=description]').val(),
        Publisher: sessionStorage.getItem('username'),
        Date: $('#formCreateAd input[name=datePublished]').val(),
        Price: Number($('#formCreateAd input[name=price]').val()).toFixed(2),
        Image: $('#formCreateAd input[name=image]').val()
    };
    //console.dir(JSON.stringify(adData))

    $.ajax({
        method: 'POST',
        url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/',
        headers: getKinveyUserAuthHeaders(),
        data: JSON.stringify(adData),
        contentType: 'application/json',
        success: createAdSuccess,
        error: handleAjaxError
    });


    function createAdSuccess(response){
        showInfo('Ad created!');
        setTimeout(function() {
            listAds();
        }, 1000);

        let visitCounts = {
            advertID: response._id,
            countVisited: 0,
            countLiked: ["empty"]
        }



        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'appdata/' + appKey + '/visitedCountArtForSale',
            headers: getKinveyUserAuthHeaders(),
            data: JSON.stringify(visitCounts),
            contentType: 'application/json',
            error: handleAjaxError
        })
    }
}

function deleteAdv(deleteAdvertId){
    let deleteAdVisitCountRequest =  $.ajax({
        method: 'DELETE',
        url: kinveyBaseUrl + "appdata/" + appKey + `/visitedCountArtForSale/?query={"advertID":"${deleteAdvertId}"}`,
        headers: getKinveyUserAuthHeaders()
    });

    let deleteAdRequest = $.ajax({
        method: 'DELETE',
        url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/' + deleteAdvertId,
        headers: getKinveyUserAuthHeaders()
    });

    Promise.all([deleteAdVisitCountRequest, deleteAdRequest])
        .then(deleteSuccess)
        .catch(handleAjaxError)


    function deleteSuccess([result1, result2]){
        showInfo('Ad deleted!');
        setTimeout(function(){
            listAds();
        }, 1000)

    }
}

function editAd(event){
    event.preventDefault();
    let adEditData = {
        Title: $('#formEditAd input[name=title]').val(),
        Description: $('#formEditAd textarea[name=description]').val(),
        Publisher: sessionStorage.getItem('username'),
        Date: $('#formEditAd input[name=datePublished]').val(),
        Price: Number($('#formEditAd input[name=price]').val()).toFixed(2),
        Image: $('#formEditAd input[name=image]').val()
    };

    if(adEditData.Title != ''
        && adEditData.Description != ''
        && adEditData.Date != '') {
        // console.dir(JSON.stringify(adEditData))
        let editAdID = $('#formEditAd input[name=id]').val()

        $.ajax({
            method: 'PUT',
            url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/' + editAdID,
            headers: getKinveyUserAuthHeaders(),
            data: JSON.stringify(adEditData),
            contentType: 'application/json',
            success: editAdSuccess,
            error: handleAjaxError
        });

        function editAdSuccess(){
            showInfo('Ad edited');
            setTimeout(function(){
                listAds();
            }, 1000);

        }
    }
}

function loadAdForEdit(editAdvertId){
    //console.log(adEdit)
    $.ajax({
        method:'GET',
        url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/' + editAdvertId,
        headers: getKinveyUserAuthHeaders(),
        success: loadAdForEditSuccess,
        error: handleAjaxError
    });

    function loadAdForEditSuccess(adForEdit){
        $('#formEditAd input[name=id]').val(adForEdit._id);
        $('#formEditAd input[name=publisher]').val(adForEdit.Publisher);
        $('#formEditAd input[name=title]').val(adForEdit.Title);
        $('#formEditAd textarea[name=description]').val(adForEdit.Description);
        $('#formEditAd input[name=datePublished]').val(adForEdit.Date);
        $('#formEditAd input[name=price]').val(adForEdit.Price);
        $('#formEditAd input[name=image]').val(adForEdit.Image);
        showView('viewEditAd');
    }
}

function displayAdvert(advertId) {
    $.ajax({
        method: "GET",
        url: kinveyBaseUrl + "appdata/" + appKey + `/visitedCountArtForSale/?query={"advertID":"${advertId}"}`,
        headers: getKinveyUserAuthHeaders(),
        success: visitedCountArtForSaleSuccess,
        error: handleAjaxError
    })

    function visitedCountArtForSaleSuccess(response) {
        let count = response[0].countVisited;
        count++;

        let dataCount = {
            advertID: response[0].advertID,
            countVisited: count,
            countLiked: response[0].countLiked
        };

        $.ajax({
            method: "PUT",
            url: kinveyBaseUrl + "appdata/" + appKey + '/visitedCountArtForSale/' + response[0]._id,
            headers: getKinveyUserAuthHeaders(),
            data: JSON.stringify(dataCount),
            contentType: 'application/json',
            success: displayAdWithVisitCountSuccess,
            error: handleAjaxError
        })
    };

    function displayAdWithVisitCountSuccess(advertLikesAndVisitCount) {

        let getAdRequest = {
            method: 'GET',
            url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/' + advertId,
            headers: getKinveyUserAuthHeaders()
        };

        $.ajax(getAdRequest).then(function (advert) {
            let likes = 0;
            advertLikesAndVisitCount.countLiked == "empty" ?
                likes = 0 :
                likes = advertLikesAndVisitCount.countLiked.length;

            $('#viewDetailsAd').empty();
            let html = $('<div>');
            html.append(
                $('<img>').attr('src', advert.Image),
                $('<br>'),
                $('<label>').text('Price:'),
                $('<h1>').text(advert.Price),
                $('<br>'),
                $('<label>').text('Title:'),
                $('<h1>').text(advert.Title),
                $('<br>'),
                $('<label style="font-weight:bold">').text('Description:'),
                $('<p>').text(advert.Description),
                $('<br>'),
                $('<label style="font-weight:bold">').text('Publisher:'),
                $('<p>').text(advert.Publisher),
                $('<br>'),
                $('<label style="font-weight:bold">').text('Date:'),
                $('<p>').text(advert.Date),
                $('<br>'),
                $('<div style="font-weight:bold">').text('Visited: ' + advertLikesAndVisitCount.countVisited),
                $('<div style="font-weight:bold">').text('Likes: ' + likes),
                $('<div>')
                    .append($('<input type="button" id="likeBtn" value="Like">').on('click', function () {
                    addLike(advert._id)
                })));

            html.appendTo($('#viewDetailsAd'));
            showView('viewDetailsAd');
        })
    }

    function addLike(likeAdvertId) {

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + appKey + `/visitedCountArtForSale/?query={"advertID":"${likeAdvertId}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: getAdvCurrentVisitAndLikeDataSuccess,
            error: handleAjaxError
        });

        function getAdvCurrentVisitAndLikeDataSuccess(response) {
            // console.log(response)
            if (response[0].countLiked == "empty") {
                let userId = sessionStorage.getItem('userId');

                let likedData = {
                    advertID: response[0].advertID,
                    countVisited: response[0].countVisited,
                    countLiked: [userId]
                }

                $.ajax({
                    method: "PUT",
                    url: kinveyBaseUrl + "appdata/" + appKey + '/visitedCountArtForSale/' + response[0]._id,
                    headers: getKinveyUserAuthHeaders(),
                    data: JSON.stringify(likedData),
                    contentType: 'application/json',
                    success: displayAdWithVisitCountSuccess,
                    error: handleAjaxError
                });

            } else {
                // console.log(response[0].countLiked)
                let loggedUserId = sessionStorage.getItem('userId');
                if(response[0].countLiked.includes(loggedUserId)){
                    $('#errorBox').text("You can't like an advert more than once!")
                    $('#errorBox').show();
                    setTimeout(function(){
                        $('#errorBox').fadeOut()
                    }, 3000);
                } else {
                    let countLiked = response[0].countLiked;
                    countLiked.push(loggedUserId);
                    let likedData = {
                        advertID: response[0].advertID,
                        countVisited: response[0].countVisited,
                        countLiked: countLiked
                    }

                    $.ajax({
                        method: "PUT",
                        url: kinveyBaseUrl + "appdata/" + appKey + '/visitedCountArtForSale/' + response[0]._id,
                        headers: getKinveyUserAuthHeaders(),
                        data: JSON.stringify(likedData),
                        contentType: 'application/json',
                        success: displayAdWithVisitCountSuccess,
                        error: handleAjaxError
                    });
                }
            }
        }
    }
}