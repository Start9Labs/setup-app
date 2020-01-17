import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { AuthenticatePage } from './authenticate.page'

describe('AuthenticatePage', () => {
  let component: AuthenticatePage
  let fixture: ComponentFixture<AuthenticatePage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AuthenticatePage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(AuthenticatePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
