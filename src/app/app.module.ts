import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
// native
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
// services
import { RpcService } from './services/rpc.service'
import { ZeroconfMonitor } from './services/zeroconf/zeroconf.service'
import { NetworkMonitor } from './services/network.service'
// factories
import { ZeroconfMonitorFactory } from './services/zeroconf/zeroconf.service.factory'

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
    RpcService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ZeroconfMonitor, useFactory: ZeroconfMonitorFactory, deps: [Platform, Zeroconf, NetworkMonitor] },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
