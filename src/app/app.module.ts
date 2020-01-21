// general
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { IonicStorageModule } from '@ionic/storage'
import { HttpClientModule } from '@angular/common/http'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
// native
import { Clipboard } from '@ionic-native/clipboard/ngx'
import { Network } from '@ionic-native/network/ngx'
import { SecureStorage } from '@ionic-native/secure-storage/ngx'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { AuthenticatePageModule } from './modals/authenticate/authenticate.module'
import { HTTP } from '@ionic-native/http/ngx'

export class AppSettings {
  public static get APP_VERSION (): string { return '1.0.0' }
}

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    AuthenticatePageModule,
    HttpClientModule,
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    IonicStorageModule.forRoot(),
  ],
  providers: [
    // native
    Clipboard,
    SecureStorage,
    StatusBar,
    SplashScreen,
    Zeroconf,
    Network,
    HTTP,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
