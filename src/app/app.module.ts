// general
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { IonicStorageModule } from '@ionic/storage'
import { HttpClientModule } from '@angular/common/http'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
// services
import { APService } from './services/ap-service'
import { DataService } from './services/data-service'
import { HttpService } from './services/http-service'
import { LANService } from './services/lan-service'
import { WifiWizard } from './services/wifi-wizard'
// native
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { SecureStorage } from '@ionic-native/secure-storage/ngx'
import { HandshakeDaemon } from './services/handshake-daemon';
import { WifiConnectionDaemon } from './services/wifi-connection-daemon';

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
    // services
    APService,
    DataService,
    HttpService,
    LANService,
    WifiWizard,
    // native
    SecureStorage,
    StatusBar,
    SplashScreen,
    Zeroconf,
    HandshakeDaemon,
    WifiConnectionDaemon,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
