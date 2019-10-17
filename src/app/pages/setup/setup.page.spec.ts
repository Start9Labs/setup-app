import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { SetupPage } from './setup.page'

describe('SetupPage', () => {
  let component: SetupPage
  let fixture: ComponentFixture<SetupPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetupPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
