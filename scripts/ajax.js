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
    let file = $('#uploadedCreateAdvFile')[0].files[0];

    let adData = {
        Title: $('#formCreateAd input[name=title]').val(),
        Description: $('#formCreateAd textarea[name=description]').val(),
        Publisher: sessionStorage.getItem('username'),
        Date: $('#formCreateAd input[name=datePublished]').val(),
        Price: Number($('#formCreateAd input[name=price]').val()).toFixed(2),
    };

    $.ajax({
        method: 'POST',
        url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/',
        headers: getKinveyUserAuthHeaders(),
        data: JSON.stringify(adData),
        contentType: 'application/json',
        success: uploadTextContentSuccess,
        error: handleAjaxError
    });

    function uploadTextContentSuccess(response){
        uploadImage(response, file);
        // createAdSuccess(response);
    }

    function uploadImage(response, file){
        let requestUrl = kinveyBaseUrl + 'blob/' + appKey;
        let fileData = {
            "_filename":file.name,
            "size":file.size,
            "mimeType":file.type,
            "advertID":response._id,
        };

        let requestHeaders = {
            "Authorization": "Kinvey " + sessionStorage.getItem("authToken"),
            "Content-type":"application/json",
            "X-Kinvey-Content-Type": fileData.mimeType
        };

        $.ajax({
            method: "POST",
            url: requestUrl,
            headers: requestHeaders,
            data:JSON.stringify(fileData),
            contentType: 'application/json',
            success:uploadImageSuccess,
            error:handleAjaxError
        });
    }

    function uploadImageSuccess(response){
        let innerHeaders = response._requiredHeaders;
        innerHeaders["Content-Type"] = file.type;
        let uploadURL = response._uploadURL;

        console.log("CREATE innerHeaders: ");
        console.log(innerHeaders)
        console.log("CREATE File:")
        console.log(file)

        $.ajax({
            method: "PUT",
            url: uploadURL,
            headers: innerHeaders,
            processData:false, //this row is added to avoid JQuery error: illegal invocation()
            data: file,
            success: createAdSuccess(response),
            error: handleAjaxError
        })
    }

    function createAdSuccess(response){
        showInfo('Ad created!');
        setTimeout(function() {
            listAds();
        }, 1000);

        let visitCounts = {
            advertID: response.advertID,
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
    let deleteAdVisitCountRequest = $.ajax({
        method: 'DELETE',
        url: kinveyBaseUrl + "appdata/" + appKey + `/visitedCountArtForSale/?query={"advertID":"${deleteAdvertId}"}`,
        headers: getKinveyUserAuthHeaders()
    });

    let deleteAdRequest = $.ajax({
        method: 'DELETE',
        url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/' + deleteAdvertId,
        headers: getKinveyUserAuthHeaders()
    });

    $.ajax({
        method: 'GET',
        url: kinveyBaseUrl + 'blob/' + appKey + `/?query={"advertID":"${deleteAdvertId}"}`,
        headers: getKinveyUserAuthHeaders(),
    }).then(function(response){
        //The following if-else condition sets the application behaviour depending on whether there is already image available in the database for the current advert or not!!!
        //Idea: To prevent error due to missing advert image in result of eventual connection interruption during image upload at advert creation/editing!!!
        if(response.length != 0){
            let deleteImageRequest = $.ajax({
                method: 'DELETE',
                url: kinveyBaseUrl + 'blob/' + appKey + `/${response[0]._id}`,
                headers: getKinveyUserAuthHeaders(),
            });

            Promise.all([deleteAdVisitCountRequest, deleteImageRequest, deleteAdRequest])
                .then(deleteSuccess)
                .catch(handleAjaxError)
        } else {
            $('#errorBox').text('There is no image in the database for this Advert');
            $('#errorBox').show();
            setTimeout(function(){
                $('#errorBox').fadeOut()
            }, 3000);

            Promise.all([deleteAdVisitCountRequest, deleteAdRequest])
                .then(deleteSuccess)
                .catch(handleAjaxError)
        }
    }).catch(handleAjaxError);


    function deleteSuccess([result1, result2, result3]){
        showInfo('Ad deleted!');
        setTimeout(function(){
            listAds();
        }, 1000)

    }
}

function editAd(event) {
    event.preventDefault();
    let file = $('#uploadedFileEdit')[0].files[0];

    let adEditTextData = {
        Title: $('#formEditAd input[name=title]').val(),
        Description: $('#formEditAd textarea[name=description]').val(),
        Publisher: sessionStorage.getItem('username'),
        Date: $('#formEditAd input[name=datePublished]').val(),
        Price: Number($('#formEditAd input[name=price]').val()).toFixed(2),
    };

    let editAdID = $('#formEditAd input[name=id]').val();

    let requestEditAdText = {
        method: 'PUT',
        url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/' + editAdID,
        headers: getKinveyUserAuthHeaders(),
        data: JSON.stringify(adEditTextData),
        contentType: 'application/json'
    }
    //The following block of code defines edit rules if there is a file attached or not!!!
    //If there is file attached it will replace the old one, otherwise only the text content will be updated!!!
    if(file){
        $.ajax(requestEditAdText)
            .then(editTextContentSuccess)
            .catch(handleAjaxError)
    } else {
        $.ajax(requestEditAdText)
            .then(editAdSuccess)
            .catch(handleAjaxError);
    }

    function editTextContentSuccess(response){
        replaceImage(response, file);
        // createAdSuccess(response);
    }

    function replaceImage(response, file){
        let requestUrl = kinveyBaseUrl + 'blob/' + appKey;

        let fileData = {
            "_filename":file.name,
            "size":file.size,
            "mimeType":file.type,
            "advertID":response._id,
        };

        let requestHeaders = {
            "Authorization": "Kinvey " + sessionStorage.getItem("authToken"),
            "Content-type":"application/json",
            "X-Kinvey-Content-Type": fileData.mimeType
        };

        $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + 'blob/' + appKey + `/?query={"advertID":"${response._id}"}`,
            headers: getKinveyUserAuthHeaders()
        }).then(function(imageForDelete){
            //The following if-else condition sets the application behaviour depending on whether there is already image available in the database for the current advert or not!!!
            //Idea: To prevent error due to missing advert image in result of eventual connection interruption during image upload at advert creation/editing!!!
            if(imageForDelete.length != 0){
                // alert("Image exists and will be replaced with new one!!!")
                $.ajax({
                    method: 'DELETE',
                    url: kinveyBaseUrl + 'blob/' + appKey + `/${imageForDelete[0]._id}`,
                    headers: getKinveyUserAuthHeaders(),
                    success: uploadNewImage,
                    error: handleAjaxError
                });
            } else {
                // alert("No image exists for the current advert, a new one will be uploaded!!!")
                uploadNewImage();
            }
        }).catch(handleAjaxError);

        function uploadNewImage(){
            $.ajax({
                method: "POST",
                url: requestUrl,
                headers: requestHeaders,
                data:JSON.stringify(fileData),
                contentType: 'application/json',
                success:uploadNewImageSuccess,
                error:handleAjaxError
            });
                function uploadNewImageSuccess(uploadResponse){
                    // console.log("UploadNewImageSuccess")
                    // console.log(uploadResponse);
                    let innerHeaders = uploadResponse._requiredHeaders;
                    innerHeaders["Content-Type"] = file.type;
                    let uploadURL = uploadResponse._uploadURL;

                    $.ajax({
                        method: "PUT",
                        url: uploadURL,
                        headers: innerHeaders,
                        processData:false, //this row is added to avoid JQuery error: illegal invocation()
                        data: file,
                        success: editAdSuccess,
                        error: handleAjaxError
                    })
                }
        }
    }

    function editAdSuccess() {
        showInfo('Ad edited');
        setTimeout(function () {
            listAds();
        }, 1000);
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
        let reqHeaders ={
            "Authorization": "Basic " + btoa(appKey + ":" + "e0213fba6aaa4af08f9acba3cf6d5612")};

        let getAdRequest = $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + 'appdata/' + appKey + '/articlesForSale/' + advertId,
            headers: getKinveyUserAuthHeaders()
        });

        let getImageRequest = $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + 'blob/' + appKey + `/?query={"advertID":"${advertId}"}`,
            headers: reqHeaders
        });

        Promise.all([getAdRequest, getImageRequest])
            .then(function ([advert, image]) {
            let likes = 0;
            advertLikesAndVisitCount.countLiked == "empty" ?
                likes = 0 :
                likes = advertLikesAndVisitCount.countLiked.length;

            $('#viewDetailsAd').empty();
                // console.log(image[0])
            if(image[0]) {
                let html = $('<div>');
                html.append(
                    $('<img>').attr('src', image[0]._downloadURL),
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
            } else {
                $('#errorBox').text('There is no image available for this advert. Please be informed that only advert creator could solve this problem by editing the current one or deleting it and followed creation of new advert with image attached!!!');
                $('#errorBox').show();
                setTimeout(function(){
                    $('#errorBox').fadeOut()
                }, 10000);
            };
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