import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { PasscodePage } from './passcode.page'

describe('PasscodePage', () => {
  let component: PasscodePage
  let fixture: ComponentFixture<PasscodePage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PasscodePage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(PasscodePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
