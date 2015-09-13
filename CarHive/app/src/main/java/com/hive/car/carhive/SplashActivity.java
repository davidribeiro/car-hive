package com.hive.car.carhive;


import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintStream;
import java.io.Writer;
import java.util.Scanner;

public class SplashActivity extends Activity {
    String nameLogin;
    String FILENAME = "login.txt";
    private boolean nextActivity = false;
    CountDownTimer timer;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
        String login = "";
        try {
            login = readFromFile();
        } catch (IOException e) {
            e.printStackTrace();
        }
        if(!login.equals("")){
            moveToMapsActivity();
        }
        loginAlertDialog();
        doStuff();
    }

    private void doStuff() {
        continueToDoStuff();
    }

    private void continueToDoStuff() {
        timer = new CountDownTimer(5 * 60 * 1000, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                if(nextActivity){
                    moveToMapsActivity();
                    try {
                        writeToFile();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    cancelTimer();
                }
            }
            @Override
            public void onFinish() {
                doStuff();
            }
        };
        timer.start();
    }

    private void cancelTimer() {
        timer.cancel();
    }

    public void writeToFile() throws IOException {
        FileOutputStream fout;
        fout = new FileOutputStream(FILENAME, true);
        new PrintStream(fout).println(nameLogin);
        fout.close();
    }


    private boolean loginAlertDialog() {
        final AlertDialog.Builder alert = new AlertDialog.Builder(this);
        final EditText input = new EditText(this);
        alert.setView(input);
        alert.setTitle("Insira nome:");
        alert.setPositiveButton("Ok", new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int whichButton) {
                nameLogin = input.getText().toString().trim();
                String welcomeMsg = "Bem-vindo, " + nameLogin;
                Toast.makeText(getApplicationContext(), welcomeMsg, Toast.LENGTH_SHORT).show();
                nextActivity = true;
            }
        });
        alert.show();
        return true;
    }

    public String readFromFile() throws IOException {
        String name = "";
        Scanner s = new Scanner(new FileInputStream(FILENAME), "utf-8");
        s.close();
        return name;
    }

    private void moveToMapsActivity() {
        int secondsDelayed = 3;
        new Handler().postDelayed(new Runnable() {
            public void run() {
                Intent i = new Intent(getApplicationContext(), MapsActivity.class);
                i.putExtra("new_variable_name",nameLogin.toString());
                startActivity(i);
                finish();
            }
        }, secondsDelayed * 1000);
    }

    public boolean isExternalStorageWritable() {
        String state = Environment.getExternalStorageState();
        if (Environment.MEDIA_MOUNTED.equals(state)) {
            return true;
        }
        return false;
    }

    /* Checks if external storage is available to at least read */
    public boolean isExternalStorageReadable() {
        String state = Environment.getExternalStorageState();
        if (Environment.MEDIA_MOUNTED.equals(state) ||
                Environment.MEDIA_MOUNTED_READ_ONLY.equals(state)) {
            return true;
        }
        return false;
    }
}