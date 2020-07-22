import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
// native
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { HttpService } from './services/http/http.service'
import { HttpServiceFactory } from './services/http/http.service.factory'

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
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
