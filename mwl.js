var mwlJSON = {};
var cardsJSON = {};
var merged = {};

function fetchJSONs(){
    var mwlRequest = new XMLHttpRequest();
    mwlRequest.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            mwlJSON = JSON.parse(mwlRequest.responseText);
            make_merged_data();
        }
    }
    mwlRequest.open('GET', 'https://netrunnerdb.com/api/2.0/public/mwl');
    mwlRequest.send();
    var cardsRequest = new XMLHttpRequest();
    cardsRequest.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            cardsJSON = JSON.parse(cardsRequest.responseText);
            make_merged_data();
        }
    }
    cardsRequest.open('GET', 'https://netrunnerdb.com/api/2.0/public/cards');
    cardsRequest.send();
}

function make_mwl_selector()
{
    var writeThis = '<select name="MWL Selector" onchange="show_chosen_mwl(this.value)"> <option selected disabled value="none"></option>';
    for (const mwl in merged.data) {
        writeThis += '<option value="' + mwl + '">' + merged.data[mwl].name + '</option>';
    }
    writeThis += '</select>'
    document.getElementById("mwl_selector").innerHTML = writeThis;
}

function listif(cards, reqs)
{
    writeThis = "";
    for (const c in cards) {
        reqsMet = true;
        for (r in reqs) {
            if (cards[c][r] != reqs[r]) reqsMet = false;
        }
        if (reqsMet == true) writeThis += '<p><a target="_blank" href="https://netrunnerdb.com/en/card/' + cards[c].code + '">' + c + '</a></p>';
    }
    return writeThis;
}

function show_relevant_guidance(system)
{
    for (x of document.getElementsByClassName("guidance"))
        x.style.display = "none";
    document.getElementById(system).style.display = "block";
}

function show_chosen_mwl(mwlNum)
{
    var writeThis = "";
    if (mwlNum in merged.data)
    {
        var chosenMWL = merged.data[mwlNum];
        show_relevant_guidance(chosenMWL.system);
        writeThis += "<h1>" + chosenMWL.name + "</h1>";
        writeThis += "<p>Date this came into effect: " + chosenMWL.date_start + "</p>";
        writeThis += "<p>Issuer: " + chosenMWL.issuer + "</p>";
        writeThis += "<p>System: " + {"inf_red":"Influence Reduction", "uni_inf":"Universal Influence", "ban_and_res":"Banned and Restricted", "ban":"Ban List" }[chosenMWL.system] + "</p>";
        var sides = {"corp":"Corp","runner":"Runner"};
        for (s in sides)
        {
            writeThis += "<h2>" + sides[s] + "</h2>";
            var limits = {"banned":"Banned", "restricted":"Restricted", "inf_red":"Influence Reduction", "inf1":"Universal Influence Level 1", "inf3":"Universal Influence Level 3" };
            for (l in limits)
            {
                 var htmlList = listif(chosenMWL.cards, {"side_code":s, "limit":l});
                 if (htmlList != "") {
                     writeThis += "<h4>" + limits[l] + ":</h4>" + htmlList;
                 }
            }
        }
    }
    document.getElementById("chosen_mwl").innerHTML = writeThis;
}

function make_merged_data()
{
    if ("data" in mwlJSON && "data" in cardsJSON)
    {
        merged.data = {};
        for (const mwl in mwlJSON.data)
        {
            merged.data[mwl] = { "name": mwlJSON.data[mwl].name, "date_start":mwlJSON.data[mwl].date_start, "cards": {} };
            var mwldate = new Date(mwlJSON.data[mwl].date_start);
            if (mwldate < new Date(2018,10,1))
                merged.data[mwl].issuer = "FFG";
            else
                merged.data[mwl].issuer = "NISEI";

            if (mwldate < new Date(2017,1))
                merged.data[mwl].system = "inf_red";
            else if (mwldate < new Date(2017,6))
                merged.data[mwl].system = "uni_inf";
            else if (mwldate < new Date(2020,2))
                merged.data[mwl].system = "ban_and_res";
            else
                merged.data[mwl].system = "ban";

            for (const cc in mwlJSON.data[mwl].cards)
            {
                var mwlcard = mwlJSON.data[mwl].cards[cc];
                var jcard = cardsJSON.data.find( function(cid){ return cid.code == cc } );
                var limit = "";
		if ("global_penalty" in mwlcard) limit = "inf_red";
                if ("universal_faction_cost" in mwlcard) {
                    if (mwlcard.universal_faction_cost == 1) limit = "inf1";
                    if (mwlcard.universal_faction_cost == 3) limit = "inf3";
                }
		if ("deck_limit" in mwlcard) limit = "banned";
		if ("is_restricted" in mwlcard) limit = "restricted";

                merged.data[mwl].cards[jcard.stripped_title] = {"code": jcard.code, "side_code": jcard.side_code, "limit":limit};
            }
        }
//        document.getElementById("debug").innerHTML = JSON.stringify(merged);
        make_mwl_selector();
    }
}
