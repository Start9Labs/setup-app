import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { ValueInputPage } from './value-input.page'

describe('ValueInputPage', () => {
  let component: ValueInputPage
  let fixture: ComponentFixture<ValueInputPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ValueInputPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(ValueInputPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
