// general
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { IonicStorageModule } from '@ionic/storage'
import { HttpClientModule } from '@angular/common/http'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
import { AuthenticatePageModule } from './modals/authenticate/authenticate.module'
// native
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { HTTP } from '@ionic-native/http/ngx'

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
    Zeroconf,
    HTTP,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
