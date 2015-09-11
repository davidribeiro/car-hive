package com.hive.car.carhive;

import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;


public class JSONParser {

    private ArrayList<LatLng> streets;
    private String line;
    private JSONArray array;

    public JSONParser(JSONObject object) {
        streets = new ArrayList<>();
        try {
            array = object.getJSONArray("streetSegment");
            line = array.toString();
        } catch (JSONException e) {
            line = "oops";
        }
    }

    public String getLine() {
        return line;
    }

    public JSONArray getArray() {
        return array;
    }
}
