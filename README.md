# Frustum Culling 视锥剔除

**说明：**

打开本项目后，请不要直接打开index.html，必须在项目目录下运行一个web server，否则会出现模型加载异常，或者可以直接访问 https://closecv.com/frustumculling 如果直接在线访问本项目，因为模型较大，受网速限制请耐心等待网页打开（可能要十多秒…… 模型13m大）。



**实验目的：**

1. 实现视锥剔除算法
2. 尝试使用不同的剔除方法(AABB/OBB…), 测一下性能分别如何，给出实验数据

**实验原理：**

​	视锥(准确说是平截头体Frustum)的形状酷似一个塔尖被削平了的金字塔,更准确地说,是一个四棱锥的顶点偏下位置被一个裁面(Clipping Plane,见图1)裁断.事实上,视锥本身就是由6个面所组成.这6个面被称为近裁面,远裁面,上裁面,下裁面,左裁面,右裁面.视锥剪裁仅仅是一个用来判断物体是否需要被绘制的过程.尽管从本质上讲视锥剔除应该是三维层面的,但事实上大多数时候它仅仅需要以纯代数的方法便能解决.而且是在渲染管线(Rendering Pipeline)之前进行的,不像背面剔除(Backface Culling)那样需要在渲染管线之后一个顶点一个顶点地计算.对于被剪裁掉的物体绘图引擎都不会将其送入显卡,因此视锥剔除对渲染速度有巨大的改善,毕竟什么都不渲染是最快的渲染.

![](http://static.oschina.net/uploads/img/201310/20020542_5jKt.png)

**实验内容：**

​	因为精力有限，本次实验使用 **three.js**完成，使用到的重要的类有**Frustum**和**Boxhelper**。

​	Frustum类是一个封装了平截头体以及其相关方法的类，例如intersectsBox方法和intersectsSphere方法可以非常方便的求平截头体和包围盒或包围球的位置关系。而Boxhelper可以根据物体方便得求其包围盒或包围球。之后要做的事就是剔除在视锥之外的物体了。



相关源码

使用相机的投影矩阵和世界坐标系变换矩阵的逆构建Frustum:

```js
setFromMatrix: function ( m ) {

		var planes = this.planes;
		var me = m.elements;
		var me0 = me[ 0 ], me1 = me[ 1 ], me2 = me[ 2 ], me3 = me[ 3 ];
		var me4 = me[ 4 ], me5 = me[ 5 ], me6 = me[ 6 ], me7 = me[ 7 ];
		var me8 = me[ 8 ], me9 = me[ 9 ], me10 = me[ 10 ], me11 = me[ 11 ];
		var me12 = me[ 12 ], me13 = me[ 13 ], me14 = me[ 14 ], me15 = me[ 15 ];

		planes[ 0 ].setComponents( me3 - me0, me7 - me4, me11 - me8, me15 - me12 ).normalize();
		planes[ 1 ].setComponents( me3 + me0, me7 + me4, me11 + me8, me15 + me12 ).normalize();
		planes[ 2 ].setComponents( me3 + me1, me7 + me5, me11 + me9, me15 + me13 ).normalize();
		planes[ 3 ].setComponents( me3 - me1, me7 - me5, me11 - me9, me15 - me13 ).normalize();
		planes[ 4 ].setComponents( me3 - me2, me7 - me6, me11 - me10, me15 - me14 ).normalize();
		planes[ 5 ].setComponents( me3 + me2, me7 + me6, me11 + me10, me15 + me14 ).normalize();

		return this;

	}
```



判断Frustum和包围球是否相交：

```js
intersectsSphere: function ( sphere ) {

		var planes = this.planes;
		var center = sphere.center;
		var negRadius = - sphere.radius;

		for ( var i = 0; i < 6; i ++ ) {

			var distance = planes[ i ].distanceToPoint( center );

			if ( distance < negRadius ) {

				return false;

			}

		}

		return true;

	}
```





判断Frustum和包围盒是否相交：

```js
intersectsBox: function () {

		var p1 = new Vector3(),
			p2 = new Vector3();

		return function intersectsBox( box ) {

			var planes = this.planes;

			for ( var i = 0; i < 6; i ++ ) {

				var plane = planes[ i ];

				p1.x = plane.normal.x > 0 ? box.min.x : box.max.x;
				p2.x = plane.normal.x > 0 ? box.max.x : box.min.x;
				p1.y = plane.normal.y > 0 ? box.min.y : box.max.y;
				p2.y = plane.normal.y > 0 ? box.max.y : box.min.y;
				p1.z = plane.normal.z > 0 ? box.min.z : box.max.z;
				p2.z = plane.normal.z > 0 ? box.max.z : box.min.z;

				var d1 = plane.distanceToPoint( p1 );
				var d2 = plane.distanceToPoint( p2 );

				// if both outside plane, no intersection

				if ( d1 < 0 && d2 < 0 ) {

					return false;

				}

			}

			return true;

		}
```



**实验成果：**

![](https://ws1.sinaimg.cn/large/006gbcdOgy1frzki4qz13g30z50i3kjl.jpg)

如上图所示，当刚打开web界面时，坐标原点处会出现一把狙击枪，此时可以转动视角或拉近距离观看，fps都一直稳定在60左右。当点击添加物体后，会出现更多的狙击枪，当狙击枪数量到十多吧以后我们明显看到帧率下降，这时候打开剔除算法，帧率又得到一定提升。当摄像头拉近，只观察位于原点的狙击枪时，由于其他狙击枪都被剔除了，帧率又恢复到了60帧。

**实验数据：**

![](https://ws1.sinaimg.cn/large/006gbcdOgy1frzmaihtjfj31lg0dugnh.jpg)

我们可以看出：

1. 使用剔除算法后，当拉近摄像头时，渲染速度会非常快，因为绝大多数物体都被剔除了。
2. 即使是远景下，因为可以剔除部分物体，渲染速度也得到了明显加快。
3. 在实验中，AABB包围盒和包围球没有明显优劣。

**实验参考：**

1. [Frustum - three.js docs]: https://threejs.org/docs/#api/math/Frustum

2. [THREE.js check if object is in frustum - Stack Overflow]: https://stackoverflow.com/questions/24877880/three-js-check-if-object-is-in-frustum

3. [three.js 如何判断一个坐标是否在相机视野内？ - 知乎]: https://www.zhihu.com/question/49989787

4. [[3D图形学\]视锥剔除入门(翻译) - szszss]: https://my.oschina.net/u/999400/blog/170062

   