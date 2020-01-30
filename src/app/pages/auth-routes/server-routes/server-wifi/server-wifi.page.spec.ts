import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { ServerWifiPage } from './server-wifi.page'

describe('ServerWifiPage', () => {
  let component: ServerWifiPage
  let fixture: ComponentFixture<ServerWifiPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServerWifiPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(ServerWifiPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
