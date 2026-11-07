/**
 * Vant 客户端组件统一注册
 * ------------------------------------------------------------
 * 只注册项目实际使用的组件，避免全量 JS 体积；样式全量引入便于主题覆盖。
 * 新增组件时在此处追加即可（PC 端布局由 Tailwind 负责）。
 */
import {
  Button,
  Field,
  Cell,
  CellGroup,
  Icon,
  Search,
  Tab,
  Tabs,
  Tag,
  Image,
  Swipe,
  SwipeItem,
  Popup,
  Uploader,
  Switch,
  Picker,
  NavBar,
  Tabbar,
  TabbarItem,
  Empty,
  Loading,
  Form,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Stepper,
  Divider,
  Collapse,
  CollapseItem,
  Badge,
  Grid,
  GridItem,
  Skeleton,
  NoticeBar,
  Progress
} from 'vant'

export default defineNuxtPlugin((nuxtApp) => {
  const components = [
    Button, Field, Cell, CellGroup, Icon, Search, Tab, Tabs, Tag, Image,
    Swipe, SwipeItem, Popup, Uploader, Switch, Picker, NavBar, Tabbar,
    TabbarItem, Empty, Loading, Form, Checkbox, CheckboxGroup, Radio,
    RadioGroup, Stepper, Divider, Collapse, CollapseItem, Badge, Grid,
    GridItem, Skeleton, NoticeBar, Progress
  ]
  components.forEach((component) => {
    nuxtApp.vueApp.component(component.name, component)
  })
})
