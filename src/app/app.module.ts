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
import { AppService } from './services/app.service'
import { ClipboardService } from './services/clipboard.service'
import { HttpService } from './services/http.service'
import { StatusCheckService } from './services/status-check.service'
import { S9ServerModel } from './models/server-model'
import { SetupService } from './services/setup.service'
// native
import { Clipboard } from '@ionic-native/clipboard/ngx'
import { Network } from '@ionic-native/network/ngx'
import { SecureStorage } from '@ionic-native/secure-storage/ngx'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'

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
    ClipboardService,
    HttpService,
    StatusCheckService,
    S9ServerModel,
    SetupService,
    // native
    Clipboard,
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
