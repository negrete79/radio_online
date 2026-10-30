package com.palio2.rastreador
import android.app.*
import android.content.Intent
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*

class LocationService : Service() {
    private lateinit var fusedClient: FusedLocationProviderClient
    private val channelId = "rastreador_channel"

    override fun onCreate() {
        super.onCreate()
        fusedClient = LocationServices.getFusedLocationProviderClient(this)
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Rastreador Palio2 ATIVO")
            .setContentText("Localização sendo rastreada - ícone visível para segurança")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build()
        startForeground(1, notification)

        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 15000).build()
        try {
            fusedClient.requestLocationUpdates(request, object : LocationCallback() {
                override fun onLocationResult(result: LocationResult) {
                    val loc = result.lastLocation ?: return
                    // AQUI você pode enviar para seu Supabase se quiser
                    // Log só pra teste: println("Lat: ${loc.latitude} Lng: ${loc.longitude}")
                }
            }, Looper.getMainLooper())
        } catch (e: SecurityException) { }
        return START_STICKY
    }

    private fun createChannel() {
        val channel = NotificationChannel(channelId, "Rastreador Palio", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
