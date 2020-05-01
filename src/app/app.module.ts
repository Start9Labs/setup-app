// general
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { HttpClientModule } from '@angular/common/http'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
import { AuthenticatePageModule } from './modals/authenticate/authenticate.module'
// native
import { Zeroconf } from '@ionic-native/zeroconf/ngx'

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    AuthenticatePageModule,
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
  ],
  providers: [
    // native
    Zeroconf,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
