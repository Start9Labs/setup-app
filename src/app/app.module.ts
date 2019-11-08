// general
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { IonicStorageModule } from '@ionic/storage'
import { HttpClientModule } from '@angular/common/http'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
// daemons
import { HealthDaemon } from './daemons/health-daemon'
import { WifiDaemon } from './daemons/wifi-daemon'
import { ZeroconfDaemon } from './daemons/zeroconf-daemon'
// services
import { HttpService } from './services/http.service'
import { S9ServerModel } from './models/server-model'
import { SetupService } from './services/setup.service'
// native
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { Network } from '@ionic-native/network/ngx'
import { SecureStorage } from '@ionic-native/secure-storage/ngx'
import { AppService } from './services/app.service'

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    HttpClientModule,
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    IonicStorageModule.forRoot(),
  ],
  providers: [
    // daemons
    HealthDaemon,
    WifiDaemon,
    ZeroconfDaemon,
    // services
    AppService,
    S9ServerModel,
    HttpService,
    SetupService,
    // native
    SecureStorage,
    StatusBar,
    SplashScreen,
    Zeroconf,
    Network,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
