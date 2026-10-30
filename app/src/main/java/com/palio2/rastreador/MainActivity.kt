package com.palio2.rastreador
import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import android.widget.Button
import android.widget.LinearLayout
import android.widget.Toast

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(50,100,50,100) }
        val btnStart = Button(this).apply { text = "INICIAR RASTREAMENTO PALIO" }
        val btnStop = Button(this).apply { text = "PARAR RASTREAMENTO" }
        layout.addView(btnStart); layout.addView(btnStop)
        setContentView(layout)

        btnStart.setOnClickListener {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.POST_NOTIFICATIONS), 1)
                return@setOnClickListener
            }
            startForegroundService(Intent(this, LocationService::class.java))
            Toast.makeText(this, "Rastreamento INICIADO - notificação visível", Toast.LENGTH_LONG).show()
        }
        btnStop.setOnClickListener {
            stopService(Intent(this, LocationService::class.java))
            Toast.makeText(this, "Rastreamento PARADO", Toast.LENGTH_SHORT).show()
        }
    }
}
