import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { ManagePage } from './manage.page'

describe('ListPage', () => {
  let component: ManagePage
  let fixture: ComponentFixture<ManagePage>
  let listPage: HTMLElement

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManagePage ],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(ManagePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have a list of 10 elements', () => {
    listPage = fixture.nativeElement
    const items = listPage.querySelectorAll('ion-item')
    expect(items.length).toEqual(10)
  })

})
