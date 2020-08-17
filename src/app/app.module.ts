import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
// native
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { HttpService } from './services/http/http.service'
import { HttpServiceFactory } from './services/http/http.service.factory'
import { HmacService } from './services/hmac/hmac.service'
import { HmacServiceFactory } from './services/hmac/hmac.service.factory'
import { ZeroconfMonitorFactory } from './services/zeroconf/zeroconf.service.factory'
import { ZeroconfMonitor } from './services/zeroconf/zeroconf.service'
import { NetworkMonitor } from './services/network.service'

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
  ],
  providers: [
    Zeroconf,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HttpService, useFactory: HttpServiceFactory, deps: [] },
    { provide: HmacService, useFactory: HmacServiceFactory, deps: [] },
    { provide: ZeroconfMonitor, useFactory: ZeroconfMonitorFactory, deps: [Platform, Zeroconf, NetworkMonitor] },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
