import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { AppInstalledShowPage } from './app-installed-show.page'

describe('AppInstalledShowPage', () => {
  let component: AppInstalledShowPage
  let fixture: ComponentFixture<AppInstalledShowPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppInstalledShowPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppInstalledShowPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
