import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { AvailableAppShowPage } from './available-app-show.page'

describe('AvailableAppShowPage', () => {
  let component: AvailableAppShowPage
  let fixture: ComponentFixture<AvailableAppShowPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AvailableAppShowPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AvailableAppShowPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
