import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { ServerNotificationsPage } from './server-notifications.page'

describe('ServerNotificationsPage', () => {
  let component: ServerNotificationsPage
  let fixture: ComponentFixture<ServerNotificationsPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServerNotificationsPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(ServerNotificationsPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
