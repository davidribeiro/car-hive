package com.hive.car.carhive;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.IntentSender;
import android.graphics.Color;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.support.v4.app.FragmentActivity;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

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
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import static com.android.volley.Request.Method.GET;
import static com.android.volley.Response.ErrorListener;


public class MapsActivity extends FragmentActivity implements
        GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener,
        LocationListener {

    public static final String TAG = MapsActivity.class.getSimpleName();
    double currentLatitude = 0;
    double currentLongitude = 0;
    RequestQueue requestQueue;
    TextView debugView;
    List<Polyline> polylines;
    private LatLng lastPosition;
    private Button searchButton, carButton, parkButton;
    private EditText searchText;
    private float zoomLevel = (float) 17.5;
    private LatLng markerPoint;
    private Marker myCarMarker;


    private final static int CONNECTION_FAILURE_RESOLUTION_REQUEST = 9000;

    private GoogleMap mMap;

    private GoogleApiClient mGoogleApiClient;
    private LocationRequest mLocationRequest;
    private Geocoder geocoder;
    private ArrayList<Marker> markers;
    private String nameLogin;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);
        setUpMapIfNeeded();

        Bundle extras = getIntent().getExtras();
        if (extras != null) {
            nameLogin = extras.getString("new_variable_name");
        }
        requestQueue = Volley.newRequestQueue(this);
        polylines = new ArrayList<>();
        markers = new ArrayList<>();
        myCarMarker = mMap.addMarker(new MarkerOptions().position(new LatLng(0,0)));
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
        mMap.getUiSettings().setMapToolbarEnabled(false);

        // MARKERS
        mMap.setOnMapClickListener(new GoogleMap.OnMapClickListener() {
            @Override
            public void onMapClick(LatLng point) {
                markerPoint = point;
                //sendMarker(point);
                //debugView.setText(point.toString());
            }
        });

        //SEARCH BUTTON
        searchButton = (Button) findViewById(R.id.searchButton);
        searchButtonListener();
        carButton = (Button) findViewById(R.id.myCarButton);
        parkButton = (Button) findViewById(R.id.reportSpots);
        carButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (markerPoint==null) {
                    return;
                }
                sendMarker(markerPoint, 0);
            }
        });
        parkButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                final AlertDialog.Builder alert = new AlertDialog.Builder(MapsActivity.this);
                final EditText input = new EditText(MapsActivity.this);
                alert.setView(input);
                alert.setTitle("Insira número de lugares vazios:");
                alert.setPositiveButton("Ok", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int whichButton) {
                        int x = Integer.parseInt(input.getText().toString().trim());
                        sendMarker(markerPoint, x);
                    }});
                alert.show();
            }
        });

        // GET Requests
        doStuff();

    }
    // MAKE POST REQUEST
    private void sendMarker(final LatLng point, final int dudeWheresMycar) {
        //http://178.62.91.40:8080/lat=41.17517550113526&lng=-8.586116256192327&flag=0&user=Tunes
        String url = "http://178.62.91.40:8080/lat=";
        url = url.concat(String.valueOf(point.latitude));
        url = url.concat("&lng=");
        url = url.concat(String.valueOf(point.longitude));
        url = url.concat("&flag=");
        url = url.concat(String.valueOf(dudeWheresMycar));
        url = url.concat("&user=");
        url = url.concat(nameLogin);
        JsonObjectRequest requestMarker = new JsonObjectRequest(Request.Method.GET, url,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        if(dudeWheresMycar==0){
                            myCarMarker.remove();
                            myCarMarker = mMap.addMarker(new MarkerOptions().position(point).title("O seu carro")
                                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_BLUE)));
                        }
                        else {
                            mMap.addMarker(new MarkerOptions().position(point).title("Reportou " + dudeWheresMycar + " lugares")
                                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));

                        }
                        Toast.makeText(getApplicationContext(), "Marcador adicionado", Toast.LENGTH_SHORT).show();
                    }
                }, new ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {

            }
        });
        requestQueue.add(requestMarker);

    }



    private void searchButtonListener() {
        searchButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                searchText = (EditText) findViewById(R.id.searchText);
                String location = searchText.getText().toString();
                geocoder = new Geocoder(getApplicationContext(), Locale.getDefault());
                List<Address> addresses;
                try {
                    addresses = geocoder.getFromLocationName(location, 1);

                    if (addresses.size() > 0) {
                        Address address = addresses.get(0);
                        //debugView.setText(address.getLatitude() + " " + address.getLongitude());
                        LatLng latLng = new LatLng(address.getLatitude(), address.getLongitude());
                        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(latLng, zoomLevel));
                        lastPosition = latLng;
                    } else {
                        String searchError = "Morada não encontrada";
                        Toast.makeText(getApplicationContext(), searchError, Toast.LENGTH_SHORT).show();
                    }

                } catch (IOException e) {
                    e.printStackTrace();
                    debugView.setText("Erro");
                }


            }
        });
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
                    debugView = (TextView) findViewById(R.id.textView);
                    //  GOTTA CHANGE THE URL TO OUR SERVER
                    //String url = "http://178.62.91.40:8080/lat=";
                    String url = "http://api.geonames.org/findNearbyStreetsOSMJSON?lat=";
                    url = url.concat(String.valueOf(center.latitude));
                    url = url.concat("&lng=");
                    url = url.concat(String.valueOf(center.longitude));
                    url = url.concat("&maxRows=20&username=carHive");

                    JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(GET, url,
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
                                        debugView.setText("");
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
                            debugView.setText("Something went wrong!");
                        }
                    });
                    requestQueue.add(jsonObjectRequest);
                    getMarkers();
                }

            }

            @Override
            public void onFinish() {

                doStuff();
            }
        }.start();
    }

    private void getMarkers() {
        String url = "http://178.62.91.40:8080/lat=";
        url = url.concat(String.valueOf(lastPosition.latitude));
        url = url.concat("&lng=");
        url = url.concat(String.valueOf(lastPosition.longitude));
        url = url.concat("&markers");

        JsonObjectRequest request = new JsonObjectRequest(GET, url, new Response.Listener<JSONObject>() {
            @Override
            public void onResponse(JSONObject response) {
                for(int i=0; i<markers.size(); i++){
                    markers.get(i).remove();
                }
                markers = new ArrayList<>();
                    try {
                    JSONArray array = response.getJSONArray("markers");
                    for(int i=0; i<array.length(); i++) {
                        if (array.getJSONObject(i).isNull("nSpots")) {
                            String string = (String) array.getJSONObject(i).get("coords");
                            string = string.replace(" ", "_");
                            String[] pos = string.split("_");
                            LatLng latLng = new LatLng(Double.parseDouble(pos[1]),Double.parseDouble(pos[0]));
                            MarkerOptions marker = new MarkerOptions().position(latLng).title("nulo");
                            Marker thisMarker = mMap.addMarker(marker);
                            markers.add(thisMarker);
                        }
                    }
                } catch (JSONException e) {
                        e.printStackTrace();
                    }
            }
        }, new ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                debugView.setText("Marker error");
            }
        });
        requestQueue.add(request);
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

        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(latLng, zoomLevel));


        // JSON REQUEST
        //makeJSONObjectRequest();
    }


    /**
     * USED TO MAKE A REQUEST TO THE SERVER
     * RIGHT NOW ONLY ACESSING GEONAMES
     */
/*    private void makeJSONObjectRequest() {
        final LatLng center = mMap.getCameraPosition().target;
        String url = "http://api.geonames.org/findNearbyStreetsOSMJSON?lat=";
        url = url.concat(String.valueOf(center.latitude));
        url = url.concat("&lng=");
        url = url.concat(String.valueOf(center.longitude));
        url = url.concat("&username=dabydjones");
        //url = "http://178.62.91.40:8080/";

        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(GET,url,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        JSONParser parser = new JSONParser(response);
                        JSONArray array = parser.getArray();
                        String[] lines = new String[array.length()];
        //                debugView.setText(center.toString());
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
                        debugView.setText("Oops, something went wrong.");
                    }
                });
        requestQueue.add(jsonObjectRequest);
    }*/

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