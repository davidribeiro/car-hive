package com.hive.car.carhive;

import android.content.IntentSender;
import android.graphics.Color;
import android.location.Location;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.support.v4.app.FragmentActivity;
import android.util.Log;
import android.widget.TextView;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import static com.android.volley.Response.ErrorListener;


public class MapsActivity extends FragmentActivity implements
        GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener,
        LocationListener {

    public static final String TAG = MapsActivity.class.getSimpleName();
    double currentLatitude = 0;
    double currentLongitude = 0;
    RequestQueue requestQueue;
    TextView view;
    List<Polyline> polylines;
    private LatLng lastPosition;

    private final static int CONNECTION_FAILURE_RESOLUTION_REQUEST = 9000;

    private GoogleMap mMap; // Might be null if Google Play services APK is not available.

    private GoogleApiClient mGoogleApiClient;
    private LocationRequest mLocationRequest;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);
        setUpMapIfNeeded();

        requestQueue = Volley.newRequestQueue(this);
        polylines = new ArrayList<>();
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .addApi(LocationServices.API)
                .build();

        // Create the LocationRequest object
        mLocationRequest = LocationRequest.create()
                .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY)
                .setInterval(10 * 1000)        // 10 seconds, in milliseconds
                .setFastestInterval(1000); // 1 second, in milliseconds
        lastPosition = mMap.getCameraPosition().target;

        // DISABLE UI SETTINGS
        mMap.getUiSettings().setIndoorLevelPickerEnabled(false);
        mMap.getUiSettings().setCompassEnabled(false);
        mMap.getUiSettings().setZoomControlsEnabled(false);
        mMap.getUiSettings().setZoomGesturesEnabled(false);
        doStuff();

    }

    private void doStuff() {
        continueToDoStuff();
    }

    private void continueToDoStuff() {
        new CountDownTimer(1000*60*30, 100) {

            @Override
            public void onTick(long millisUntilFinished) {
                LatLngBounds bounds = mMap.getProjection().getVisibleRegion().latLngBounds;

                final LatLng center = mMap.getCameraPosition().target;
                if(!bounds.contains(lastPosition)){
                    lastPosition = center;
                    view = (TextView) findViewById(R.id.textView);
                    //  GOTTA CHANGE THE URL TO OUR SERVER
                    //String url = "http://178.62.91.40:8080/lat=";
                    String url = "http://api.geonames.org/findNearbyStreetsOSMJSON?lat=";
                    url = url.concat(String.valueOf(center.latitude));
                    url = url.concat("&lng=");
                    url = url.concat(String.valueOf(center.longitude));
                    url = url.concat("&maxRows=20&username=dabydjones");


                    JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(Request.Method.GET, url,
                        new Response.Listener<JSONObject>() {
                            @Override
                            public void onResponse(JSONObject response) {
                                //view.setText(response.toString());
                                JSONArray array;
                                try {

                                    for (Polyline line : polylines) {
                                        line.remove();
                                    }

                                    polylines.clear();

                                    array = response.getJSONArray("streetSegment");
                                    view.setText("");
                                    for (int i = 0; i < array.length(); i++) {
                                        JSONObject object = array.getJSONObject(i);
                                        String line = (String) object.get("line");
                                        drawLine(line);
                                    }


                                } catch (JSONException e) {
                                    e.printStackTrace();
                                }
                            }

                        }, new ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        view.setText("Something went wrong!");
                    }
                });
                requestQueue.add(jsonObjectRequest);
                }

            }

            @Override
            public void onFinish() {

                doStuff();
            }
        }.start();
    }


    @Override
    protected void onResume() {
        super.onResume();
        setUpMapIfNeeded();
        mGoogleApiClient.connect();
    }

    @Override
    protected void onPause() {
        super.onPause();

        if (mGoogleApiClient.isConnected()) {
            LocationServices.FusedLocationApi.removeLocationUpdates(mGoogleApiClient, this);
            mGoogleApiClient.disconnect();
        }
    }

    /**
     * Sets up the map if it is possible to do so (i.e., the Google Play services APK is correctly
     * installed) and the map has not already been instantiated.. This will ensure that we only ever
     * call {@link #setUpMap()} once when {@link #mMap} is not null.
     * <p/>
     * If it isn't installed {@link SupportMapFragment} (and
     * {@link com.google.android.gms.maps.MapView MapView}) will show a prompt for the user to
     * install/update the Google Play services APK on their device.
     * <p/>
     * A user can return to this FragmentActivity after following the prompt and correctly
     * installing/updating/enabling the Google Play services. Since the FragmentActivity may not
     * have been completely destroyed during this process (it is likely that it would only be
     * stopped or paused), {@link #onCreate(Bundle)} may not be called again so we should call this
     * method in {@link #onResume()} to guarantee that it will be called.
     */
    private void setUpMapIfNeeded() {
        // Do a null check to confirm that we have not already instantiated the map.
        if (mMap == null) {
            // Try to obtain the map from the SupportMapFragment.
            mMap = ((SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.map))
                    .getMap();



            // Check if we were successful in obtaining the map.
            if (mMap != null) {
                setUpMap();
            }
        }
    }

    private void setUpMap() {
        //mMap.addMarker(new MarkerOptions().position(new LatLng(0, 0)).title("Marker"));
    }

    private void handleNewLocation(Location location) {
        Log.d(TAG, location.toString());

        currentLatitude = location.getLatitude();
        currentLongitude = location.getLongitude();

        LatLng latLng = new LatLng(currentLatitude, currentLongitude);

        mMap.setMyLocationEnabled(true);
        //mMap.addMarker(new MarkerOptions().position(new LatLng(currentLatitude, currentLongitude)).title("Current Location"));


        // ADD MARKER TO MY POSITION
        /*
        String coordinates = String.valueOf(currentLatitude).concat(" ").concat(String.valueOf(currentLongitude));
        MarkerOptions options = new MarkerOptions().position(latLng).title(coordinates);
        mMap.addMarker(options);
        */

        // PUT ZOOM AT MY LOCATION

        float zoomLevel = (float) 17.5; //This goes up to 21
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(latLng, zoomLevel));


        // JSON REQUEST
        //makeJSONObjectRequest();
    }


    /**
     * USED TO MAKE A REQUEST TO THE SERVER
     * RIGHT NOW ONLY ACESSING GEONAMES
     */
    private void makeJSONObjectRequest() {
        final LatLng center = mMap.getCameraPosition().target;
        String url = "http://api.geonames.org/findNearbyStreetsOSMJSON?lat=";
        url = url.concat(String.valueOf(center.latitude));
        url = url.concat("&lng=");
        url = url.concat(String.valueOf(center.longitude));
        url = url.concat("&username=dabydjones");
        //url = "http://178.62.91.40:8080/";

        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(Request.Method.GET,url,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        JSONParser parser = new JSONParser(response);
                        JSONArray array = parser.getArray();
                        String[] lines = new String[array.length()];
        //                view.setText(center.toString());
                        for(int i=0; i<array.length(); i++)
                            try {
                                JSONObject aux = array.getJSONObject(i);
                                lines[i] = aux.getString("line");
                                drawLine(lines[i]);

                            } catch (JSONException e) {
                                e.printStackTrace();
                                lines[i] = "oopsLine";
                            }


                    }
                }, new ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        view.setText("Oops, something went wrong.");
                    }
                });
        requestQueue.add(jsonObjectRequest);
    }

    private void drawLine(String line) {
        ArrayList<LatLng> points = new ArrayList<>();
        line = line.replace(" ", "_");
        line = line.replace(",", "_");
        String[] pts = line.split("_");
        int i=0; int j=0;
        while(i<pts.length){
            double a, b;
            a = Double.parseDouble(pts[i]);
            i++;
            b = Double.parseDouble(pts[i]);
            i++;
            points.add(j,new LatLng(b,a));
            j++;
        }
        polylines.add(mMap.addPolyline(new PolylineOptions().addAll(points).width(5).color(Color.RED)));

    }

    @Override
    public void onConnected(Bundle bundle) {
        Location location = LocationServices.FusedLocationApi.getLastLocation(mGoogleApiClient);

        if (location == null) {
            LocationServices.FusedLocationApi.requestLocationUpdates(mGoogleApiClient, mLocationRequest, this);
        } else {
            handleNewLocation(location);
        }
    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(ConnectionResult connectionResult) {
    /*
     * Google Play services can resolve some errors it detects.
     * If the error has a resolution, try sending an Intent to
     * start a Google Play services activity that can resolve
     * error.
     */
        if (connectionResult.hasResolution()) {
            try {
                // Start an Activity that tries to resolve the error
                connectionResult.startResolutionForResult(this, CONNECTION_FAILURE_RESOLUTION_REQUEST);
            /*
             * Thrown if Google Play services canceled the original
             * PendingIntent
             */
            } catch (IntentSender.SendIntentException e) {
                // Log the error
                e.printStackTrace();
            }
        } else {
        /*
         * If no resolution is available, display a dialog to the
         * user with the error.
         */
            Log.i(TAG, "Location services connection failed with code " + connectionResult.getErrorCode());
        }
    }

    @Override
    public void onLocationChanged(Location location) {
        //handleNewLocation(location);
    }
}